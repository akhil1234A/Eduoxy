import { UserResponse, AuthTokens } from "../types/types";

export interface IAuthService {
  signUp(name: string, email: string, password: string, userType: "student" | "admin" | "teacher"): Promise<UserResponse>;
  login(email: string, password: string): Promise<AuthTokens & { user: UserResponse }>;
  verifyOtp(email: string, otp: string): Promise<boolean>;
  sendOtp(email: string): Promise<void>;
  logout(userId: string): Promise<void>;
  googleAuth(idToken: string): Promise<AuthTokens & { user: UserResponse }>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  loginWithRefresh(userId: string, refreshToken: string): Promise<AuthTokens & { user: UserResponse }>; 
}