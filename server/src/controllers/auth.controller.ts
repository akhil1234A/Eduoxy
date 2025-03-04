import { Request, Response } from "express";
import AuthService from "../services/auth.service";
import { successResponse, errorResponse } from "../types/types";
import { verifyRefreshToken, generateAccessToken } from "../utils/jwt";
import redisClient from "../config/redis";
import userRepository from "../repositories/user.repository";
import { UserResponse } from "../types/types";
import admin from "../config/firebaseAdmin";

export const signUp = async (req: Request, res: Response) => {
  try {
    const { name, email, password, userType } = req.body;
    const user = await AuthService.signUp(name, email, password, userType);

    await AuthService.sendOtp(email);
    
    res.status(201).json(successResponse("User registered. OTP sent to email."));
  } catch (error: any) {
    res.status(400).json(errorResponse("Signup failed", error.message));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const {accessToken, refreshToken, user} = await AuthService.login(email, password);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
      path:"/",
    });
    console.log('setting refresh token',refreshToken);
    res.json(successResponse("Login successful", {accessToken, user}));
  } catch (error: any) {
    res.status(401).json(errorResponse("Login failed", error.message));
  }
};


export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    await AuthService.verifyOtp(email, otp);

    res.json(successResponse("OTP verified successfully. You can now log in."));
  } catch (error:any) {
    res.status(400).json(errorResponse("OTP verification failed", error.message));
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    console.log("Cookies received:", req.cookies);
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new Error("No refresh token provided in cookies");

    const { userId, userType }  = verifyRefreshToken(refreshToken);
    console.log("Verified userId:", userId,userType);

    const storedToken = await redisClient.get(`refresh_token:${userId}`);
    console.log("Stored token from Redis:", storedToken);
    if (refreshToken !== storedToken) throw new Error("Invalid refresh token");

    const accessToken = generateAccessToken(userId, userType);
    const user = await userRepository.findById(userId); 
    if (!user) throw new Error("User not found");

    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType as "student" | "teacher" | "admin",
      isVerified: user.isVerified,
    };

    res.json(successResponse("Token refreshed", { accessToken, user: userResponse }));
  } catch (error: any) {
    console.error("Refresh error:", error.message);
    res.status(401).json(errorResponse("Refresh failed", error.message));
  }
};


export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const userId = verifyRefreshToken(refreshToken);
      await redisClient.del(`refresh_token:${userId}`);
    }
    res.clearCookie("refreshToken");
    res.json(successResponse("Logged out successfully"));
  } catch (error: any) {
    res.status(500).json(errorResponse("Logout failed", error.message));
  }
};


export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  const { idToken } = req.body;

  try {
    if (!idToken) {
      res.status(400).json(errorResponse("No ID token provided"));
      return;
    }

    const { accessToken, refreshToken, user } = await AuthService.googleAuth(idToken);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days,
      path:"/",
    });
    console.log('setting refresh token',refreshToken);
    res.json(successResponse("Google login successful", { accessToken, user }));
  } catch (error: any) {
    console.error("Google auth error:", error);
    res.status(500).json(errorResponse("Google authentication failed", error.message));
  }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(400).json(errorResponse("Email is required"));
      return;
    }
    await AuthService.requestPasswordReset(email);
    res.json(successResponse("Password reset token sent successfully"));
  } catch (error: any) {
    console.error("Password reset request error:", error);
    res.status(500).json(errorResponse("Failed to request password reset", error.message));
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      res.status(400).json(errorResponse("Token and new password are required"));
      return;
    }
    await AuthService.resetPassword(token, newPassword);
    res.json(successResponse("Password reset successfully"));
  } catch (error: any) {
    console.error("Password reset error:", error);
    res.status(error.message === "Invalid or expired reset token" ? 400 : 500).json(
      errorResponse("Failed to reset password", error.message)
    );
  }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json(errorResponse("Email is required"));
      return;
    }
    await AuthService.sendOtp(email);
    res.json(successResponse("OTP sent successfully"));
  } catch (error: any) {
    console.error("Send OTP error:", error);
    res.status(500).json(errorResponse("Failed to send OTP", error.message));
  }
}