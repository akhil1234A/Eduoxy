import { UserResponse, AuthTokens, LoginResponse, UserRole} from "../types/types";

export interface IAuthService {
  signUp(name: string, email: string, password: string, userType: UserRole): Promise<UserResponse>;
  login(email: string, password: string): Promise<LoginResponse>
  verifyOtp(email: string, otp: string): Promise<LoginResponse>;
  sendOtp(email: string): Promise<void>;
  logout(userId: string, accessToken: string): Promise<void>;
  googleAuth(idToken: string): Promise<AuthTokens & { user: UserResponse }>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  loginWithRefresh(userId: string, refreshToken: string): Promise<AuthTokens & { user: UserResponse }>; 
}