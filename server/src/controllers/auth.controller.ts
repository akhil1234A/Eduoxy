import { Request, Response } from "express";
import { IAuthService } from "../interfaces/auth.service";
import { successResponse, errorResponse, LoginResponse } from "../types/types";
import { verifyRefreshToken } from "../utils/jwt";

export class AuthController {
  constructor(private authService: IAuthService) {}

  async signUp(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, userType } = req.body;
      await this.authService.signUp(name, email, password, userType);
      res.status(201).json(successResponse("User registered. OTP sent to email."));
    } catch (error: any) {
      res.status(400).json(errorResponse("Signup failed", error.message));
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

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      res.json(successResponse("Login successful", { accessToken: result.accessToken, user: result.user }));
    } catch (error: any) {
      res.status(401).json(errorResponse("Login failed", error.message));
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await this.authService.verifyOtp(email, otp);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      res.json(successResponse("OTP verified successfully", result));
    } catch (error: any) {
      res.status(400).json(errorResponse("OTP verification failed", error.message));
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new Error("No refresh token provided in cookies");
  
      const { userId, userType } = verifyRefreshToken(refreshToken);
      const { accessToken, refreshToken: newRefreshToken, user } = await this.authService.loginWithRefresh(userId, refreshToken);
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      res.json(successResponse("Token refreshed", { accessToken, user }));
    } catch (error: any) {
      res.status(401).json(errorResponse("Refresh failed", error.message));
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) {
        const { userId } = verifyRefreshToken(refreshToken);
        await this.authService.logout(userId);
      }
      res.clearCookie("refreshToken");
      res.json(successResponse("Logged out successfully"));
    } catch (error: any) {
      res.status(500).json(errorResponse("Logout failed", error.message));
    }
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;
      if (!idToken) throw new Error("No ID token provided");

      const { accessToken, refreshToken, user } = await this.authService.googleAuth(idToken);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
      });
      res.json(successResponse("Google login successful", { accessToken, user }));
    } catch (error: any) {
      res.status(500).json(errorResponse("Google authentication failed", error.message));
    }
  }

  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new Error("Email is required");

      await this.authService.requestPasswordReset(email);
      res.json(successResponse("Password reset token sent successfully"));
    } catch (error: any) {
      res.status(500).json(errorResponse("Failed to request password reset", error.message));
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
    } catch (error: any) {
      res.status(error.message === "Invalid or expired reset token" ? 400 : 500).json(
        errorResponse("Failed to reset password", error.message)
      );
    }
  }
  

  async sendOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new Error("Email is required");

      await this.authService.sendOtp(email);
      res.json(successResponse("OTP sent successfully"));
    } catch (error: any) {
      res.status(500).json(errorResponse("Failed to send OTP", error.message));
    }
  }
}