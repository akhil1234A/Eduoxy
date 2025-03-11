import { Request, Response } from "express";
import { IAuthService } from "../interfaces/auth.service";
import { successResponse, errorResponse, LoginResponse } from "../types/types";
import { verifyRefreshToken } from "../utils/jwt";
import { HttpStatus } from "../utils/httpStatus";
import { setAuthCookies } from "../utils/setAuthCookies";
export class AuthController {
  constructor(private authService: IAuthService) {}

  async signUp(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, userType } = req.body;
      await this.authService.signUp(name, email, password, userType);
      res.status(HttpStatus.CREATED).json(successResponse("User registered. OTP sent to email."));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("Signup failed", err.message));
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      if (result.needsVerification) {
        res.json(successResponse("User not verified. OTP sent to email.", result));
        return;
      }

      setAuthCookies(res, { accessToken: result.accessToken || "", refreshToken: result.refreshToken || "" }, {id: result.user?.id || "", userType: result.user?.userType || "", userName: result.user?.name || ""});
      res.json(successResponse("Login successful", { accessToken: result.accessToken, user: result.user }));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.UNAUTHORIZED).json(errorResponse("Login failed", err.message));
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await this.authService.verifyOtp(email, otp);

      setAuthCookies(res, { accessToken: result.accessToken || "", refreshToken: result.refreshToken || "" }, {id: result.user?.id || "", userType: result.user?.userType || "", userName: result.user?.name || ""});

      res.json(successResponse("OTP verified successfully", result));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.BAD_REQUEST).json(errorResponse("OTP verification failed", err.message));
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new Error("No refresh token provided in cookies");
  
      const { userId, userType } = verifyRefreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken, user } = await this.authService.loginWithRefresh(userId, refreshToken);

      setAuthCookies(res, { accessToken: accessToken || "", refreshToken: newRefreshToken || "" }, {id: user?.id || "", userType: user?.userType || "", userName: user?.name || ""});  
      res.json(successResponse("Token refreshed", { accessToken, user }));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.UNAUTHORIZED).json(errorResponse("Refresh failed", err.message));
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        const { userId } = verifyRefreshToken(refreshToken);
        await this.authService.logout(userId);
      }
      ["accessToken", "refreshToken", "userType", "userId", "userName"].forEach((cookie) =>
        res.clearCookie(cookie, { path: "/" })
      );
      
      res.status(200).json({ message: "Logged out" });
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Logout failed", err.message));
    }
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;
      if (!idToken) throw new Error("No ID token provided");

      const { accessToken, refreshToken, user } = await this.authService.googleAuth(idToken);
      setAuthCookies(res, { accessToken: accessToken || "", refreshToken: refreshToken || "" }, {id: user?.id || "", userType: user?.userType || "", userName: user?.name || ""});  
      res.json(successResponse("Google login successful", { accessToken, user }));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Google authentication failed", err.message));
    }
  }

  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new Error("Email is required");

      await this.authService.requestPasswordReset(email);
      res.json(successResponse("Password reset token sent successfully"));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to request password reset", err.message));
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params; 
      const { newPassword, confirmPassword } = req.body;
  
      if (!token) throw new Error("Reset token is required");
      if (!newPassword || !confirmPassword) throw new Error("Both password fields are required");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
  
      await this.authService.resetPassword(token, newPassword);
      res.json(successResponse("Password reset successfully"));
    } catch (error) {
      const err = error as Error; 
      res.status(err.message === "Invalid or expired reset token" ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR).json(
        errorResponse("Failed to reset password", err.message)
      );
    }
  }
  

  async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new Error("Email is required");

      await this.authService.sendOtp(email);
      res.json(successResponse("OTP sent successfully"));
    } catch (error) {
      const err = error as Error; 
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse("Failed to send OTP", err.message));
    }
  }
}