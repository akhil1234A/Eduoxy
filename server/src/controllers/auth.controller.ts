import { Request, Response } from "express";
import { IAuthService } from "../interfaces/auth.service";
import { successResponse, errorResponse, LoginResponse } from "../types/types";
import { IJwtService} from "../utils/jwt";
import { IRedisClient } from "../config/redis";
import { HttpStatus } from "../utils/httpStatus";
import { setAuthCookies } from "../utils/setAuthCookies";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import IAuthController from "../interfaces/auth.controller";
import { apiLogger } from "../utils/logger";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";


/**
 * Controller for handling authentication
 * *    1. Sign up
 * *    2. Login
 * *    3. Verify OTP
 * *    4. Refresh token
 * *    5. Logout
 * *    6. Google authentication
 * *    7. Password reset request
 * *    8. Password reset using token
 */
@injectable()
export class AuthController implements IAuthController {
  constructor(@inject(TYPES.IAuthService) private _authService: IAuthService, @inject(TYPES.IJwtService) private _jwtService: IJwtService, @inject(TYPES.IRedisClient) private _redisClient: IRedisClient) {}

  /**
   * This method handles user sign-up for all users (Admin, Teacher, Student)
   * @param req request object
   * @param res response object
   * @return user details with access and refresh token
   */
  
  async signUp(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, userType } = req.body;
      await this._authService.signUp(name, email, password, userType);
      res.status(HttpStatus.CREATED).json(successResponse(RESPONSE_MESSAGES.AUTH.SIGNUP_SUCCESS));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.AUTH.SIGNUP_FAILURE, err.message));
    }
  }

  /**
   * This method handles user loginfor all users (Admin, Teacher, Student)
   * @param req request object
   * @param res response object
   * @returns user details with access and refresh token
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this._authService.login(email, password);


      if (result.needsVerification) {
        apiLogger.info("User not verified. OTP sent to email.", { result });
        res.json(successResponse(RESPONSE_MESSAGES.AUTH.USER_NOT_VERIFIED, result));
        return;
      }

      setAuthCookies(res, { accessToken: result.accessToken || "", refreshToken: result.refreshToken || "" }, {id: result.user?.id || "", userType: result.user?.userType || "", userName: result.user?.name || ""});
      apiLogger.info("Login successful", { result });
      res.json(successResponse(RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, { accessToken: result.accessToken, user: result.user }));
    } catch (error) {
      const err = error as Error; 
      apiLogger.error("Login failed", { error: err.message });
      res.status(HttpStatus.UNAUTHORIZED).json(errorResponse(RESPONSE_MESSAGES.AUTH.LOGIN_FAILURE, err.message));
    }
  }

  /**
   * This method handles OTP verification for new sign ups  
   * @param req request object
   * @param res response object
   * @returns user details with access and refresh token
   */
  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await this._authService.verifyOtp(email, otp);

      setAuthCookies(res, { accessToken: result.accessToken || "", refreshToken: result.refreshToken || "" }, {id: result.user?.id || "", userType: result.user?.userType || "", userName: result.user?.name || ""});

      res.json(successResponse(RESPONSE_MESSAGES.AUTH.OTP_VERIFIED, result));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse(RESPONSE_MESSAGES.AUTH.OTP_VERIFICATION_FAILED, err.message));
    }
  }

  /**
   * This method handles token refresh 
   * @param req request object
   * @param res response object
   * @returns new refresh token and access token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new Error("No refresh token provided in cookies");

      const isBlacklisted = await this._redisClient.get(`blacklist:${refreshToken}`);
     if (isBlacklisted) {
      throw new Error("Refresh token is invalid or expired");
    }
  
      const { userId, userType } = this._jwtService.verifyRefreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken, user } = await this._authService.loginWithRefresh(userId, refreshToken);

      setAuthCookies(res, { accessToken: accessToken || "", refreshToken: newRefreshToken || "" }, {id: user?.id || "", userType: user?.userType || "", userName: user?.name || ""});  
      apiLogger.info("Token refreshed", {});
      res.json(successResponse(RESPONSE_MESSAGES.AUTH.TOKEN_REFRESHED, { accessToken, user }));
    } catch (error) {
      const err = error as Error; 
      apiLogger.error("Refresh failed", { error: err.message });
      res.status(HttpStatus.UNAUTHORIZED).json(errorResponse(RESPONSE_MESSAGES.AUTH.TOKEN_REFRESH_FAILED, err.message));
    }
  }

  /**
   * This method handles user logout
   * @param req request object
   * @param res response object
   * @return success message
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      const accessToken = req.cookies.accessToken;
      if (refreshToken) {
        const { userId } = this._jwtService.verifyRefreshToken(refreshToken);
        await this._authService.logout(userId, accessToken);
      }
      ["accessToken", "refreshToken", "userType", "userId", "userName"].forEach((cookie) =>
        res.clearCookie(cookie, { path: "/" })
      );
      
      res.status(200).json(successResponse(RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.AUTH.LOGOUT_FAILED, err.message));
    }
  }

  /**
   * This method handles Google authentication
   * @param req request object
   * @param res response object
   * @returns user details with access and refresh token
   */
  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;
      if (!idToken) throw new Error("No ID token provided");
      apiLogger.info("Google authentication started", {});

      const { accessToken, refreshToken, user } = await this._authService.googleAuth(idToken);
      setAuthCookies(res, { accessToken: accessToken || "", refreshToken: refreshToken || "" }, {id: user?.id || "", userType: user?.userType || "", userName: user?.name || ""});  
      apiLogger.info("Google login successful", { });
      res.json(successResponse(RESPONSE_MESSAGES.AUTH.GOOGLE_LOGIN_SUCCESS, { accessToken, user }));
    } catch (error) {
      const err = error as Error; 
      apiLogger.error("Google authentication failed", { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.AUTH.GOOGLE_LOGIN_FAILED, err.message));
    }
  }

  /**
   * This method handles password reset request
   * @param req request object
   * @param res response object
   * @returns send a mail with reset link
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new Error("Email is required");

      await this._authService.requestPasswordReset(email);
      res.json(successResponse(RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_REQUESTED));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_FAILED, err.message));
    }
  }

  /**
   * This method handles password reset using token
   * @param req request object
   * @param res response object
   * @returns success message
   */

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params; 
      const { newPassword, confirmPassword } = req.body;
  
      if (!token) throw new Error("Reset token is required");
      if (!newPassword || !confirmPassword) throw new Error("Both password fields are required");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
  
      await this._authService.resetPassword(token, newPassword);
      res.json(successResponse(RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS));
    } catch (error) {
      const err = error as Error; 
      res.status(err.message === "Invalid or expired reset token" ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR).json(
        errorResponse(RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_FAILURE, err.message)
      );
    }
  }
  
/**
 * This method handles sending OTP for email verification
 * @param req request object
 * @param res response object
 * @return success message
 */
  async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new Error("Email is required");

      await this._authService.sendOtp(email);
      res.json(successResponse(RESPONSE_MESSAGES.AUTH.OTP_SENT_SUCCESS));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.AUTH.OTP_SENT_FAILURE, err.message));
    }
  }
}