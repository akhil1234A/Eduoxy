import bcrypt from "bcryptjs";
import { IAuthService } from "../interfaces/auth.service";
import { IUserRepository } from "../interfaces/user.repository";
import { IRedisClient } from "../config/redis"; // Define this interface if not already
import { IMailService } from "../utils/mail"; // Define this interface
import { IJwtService } from "../utils/jwt"; // Define this interface
import { UserResponse, AuthTokens } from "../types/types";
import admin from "../config/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";

export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private redisClient: IRedisClient,
    private mailService: IMailService,
    private jwtService: IJwtService
  ) {}

  async signUp(name: string, email: string, password: string, userType: "student" | "admin" | "teacher"): Promise<UserResponse> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      userType,
      isVerified: false,
      isBlocked:false,
    });

    await this.sendOtp(email);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      isVerified: user.isVerified,
    };
  }

  async login(email: string, password: string): Promise<AuthTokens & { user: UserResponse }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("No User Found");
    if (user.isBlocked) throw new Error("User is blocked");
    if (user.googleId && !user.password) throw new Error("Use Google authentication for this account");
    if (!user.password || !(await bcrypt.compare(password, user.password))) throw new Error("Invalid credentials");
    if (!user.isVerified) throw new Error("Account not verified. Please verify OTP.");

    const loginAttempts = await this.redisClient.get(`login_attempts:${email}`);
    if (loginAttempts && parseInt(loginAttempts) >= 5) throw new Error("Too many failed login attempts. Try again later.");

    const accessToken = this.jwtService.generateAccessToken(user.id, user.userType);
    const refreshToken = this.jwtService.generateRefreshToken(user.id, user.userType);

    await this.redisClient.set(`refresh_token:${user.id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      isVerified: user.isVerified,
    };

    return { accessToken, refreshToken, user: userResponse };
  }

  async sendOtp(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await this.redisClient.set(`otp:${email}`, otp, { EX: 120 });
    await this.mailService.sendOtpEmail(email, otp);
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const storedOtp = await this.redisClient.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) throw new Error("Invalid or expired OTP");

    await this.redisClient.del(`otp:${email}`);
    const user = await this.userRepository.findByEmail(email);
    if (user) await this.userRepository.update(user.id, { isVerified: true });

    return true;
  }

  async logout(userId: string): Promise<void> {
    await this.redisClient.del(`refresh_token:${userId}`);
  }

  async googleAuth(idToken: string): Promise<AuthTokens & { user: UserResponse }> {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const googleId = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name || "Google User";

    if (!email) throw new Error("Email not provided by Google authentication");

    let user = await this.userRepository.findByGoogleId(googleId);
    if (!user) {
      user = await this.userRepository.findByEmail(email);
      if (user) {
        user = await this.userRepository.update(user.id, { googleId, isVerified: true });
      } else {
        user = await this.userRepository.create({
          name,
          email,
          googleId,
          userType: "student",
          isVerified: true,
          isBlocked: false,
        });
      }
    }

    if (!user) throw new Error("User not found");
    if (user.isBlocked) throw new Error("User is blocked");

    const accessToken = this.jwtService.generateAccessToken(user.id, user.userType);
    const refreshToken = this.jwtService.generateRefreshToken(user.id, user.userType);

    await this.redisClient.set(`refresh_token:${user.id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      isVerified: user.isVerified,
    };

    return { accessToken, refreshToken, user: userResponse };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("User not found");
    if (user.googleId && !user.password) throw new Error("Use Google authentication to log in; no password to reset");

    const resetToken = uuidv4();
    const resetTokenKey = `reset_token:${user.id}`;
    await this.redisClient.set(resetTokenKey, resetToken, { EX: 15 * 60 });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const emailBody = `
      To reset your password, click the link below:\n
      ${resetUrl}\n
      This link expires in 15 minutes. If you didn’t request this, ignore this email.
    `;
    await this.mailService.sendOtpEmail(email, emailBody, "Password Reset Request");
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetTokenKeyPrefix = "reset_token:";
    const keys = await this.redisClient.keys(`${resetTokenKeyPrefix}*`);
    let userId: string | undefined;

    for (const key of keys) {
      const storedToken = await this.redisClient.get(key);
      if (storedToken === token) {
        userId = key.replace(resetTokenKeyPrefix, "");
        break;
      }
    }

    if (!userId) throw new Error("Invalid or expired reset token");

    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { password: hashedPassword });
    await this.redisClient.del(`reset_token:${userId}`);
  }

  async loginWithRefresh(userId: string, refreshToken: string): Promise<AuthTokens & { user: UserResponse }> {
    const storedToken = await this.redisClient.get(`refresh_token:${userId}`);
    if (refreshToken !== storedToken) throw new Error("Invalid refresh token");

    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const accessToken = this.jwtService.generateAccessToken(user.id, user.userType);
    const newRefreshToken = this.jwtService.generateRefreshToken(user.id, user.userType);

    await this.redisClient.set(`refresh_token:${user.id}`, newRefreshToken, { EX: 7 * 24 * 60 * 60 });

    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      isVerified: user.isVerified,
    };

    return { accessToken, refreshToken: newRefreshToken, user: userResponse };
  }

}

export default AuthService;