import bcrypt from "bcryptjs";
import redisClient from "../config/redis";
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/user.repository";
import { sendOtpEmail } from "../utils/mail";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { UserResponse, AuthTokens } from "../types/types";
import admin from '../config/firebaseAdmin';
import { v4 as uuidv4 } from "uuid";

class AuthService {
  async signUp(name: string, email: string, password: string, userType: "student" | "admin" | "teacher") {
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) throw new Error("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    return await UserRepository.create({
      name,
      email,
      password: hashedPassword,
      userType,
      isVerified: false, 
    });
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: UserResponse }> {
    const user = await UserRepository.findByEmail(email);

  if (!user) {
    throw new Error("No User Found");
  }

  // Check if user signed up with Google (no password)
  if (user.googleId && !user.password) {
    throw new Error("Use Google authentication for this account");
  }

  // Verify password for non-Google users
  if (!user.password || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }
    if (!user.isVerified) throw new Error("Account not verified. Please verify OTP.");

    const loginAttempts = await redisClient.get(`login_attempts:${email}`);
    if (loginAttempts && parseInt(loginAttempts) >= 5) {
      throw new Error("Too many failed login attempts. Try again later.");
    }
  
    const accessToken = generateAccessToken(user.id, user.userType);
    const refreshToken = generateRefreshToken(user.id, user.userType);
   
    await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
      EX: 7 * 24 * 60 * 60, 
    });

    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      isVerified: user.isVerified,
    }

    return { accessToken, refreshToken, user: userResponse };
  }

  async sendOtp(email: string) {
   
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error("User not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otp);

    
    if (!redisClient.isOpen) {
      console.log('Redis not open, connecting...');
      await redisClient.connect();
    }
    
    await redisClient.set(`otp:${email}`, otp, { EX: 120 });
    console.log('OTP set in Redis');

   
    await sendOtpEmail(email, otp);
    console.log('OTP email sent');
  }

  async verifyOtp(email: string, otp: string) {
    const storedOtp = await redisClient.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) throw new Error("Invalid or expired OTP");


    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    await redisClient.del(`otp:${email}`); 

    
    const user = await UserRepository.findByEmail(email);
    if (user) {
      await UserRepository.update(user.id, { isVerified: true });
    }
    
    return true;
  }

  async logout(userId: string) {
    await redisClient.del(`refresh_token:${userId}`);
  }

  async googleAuth(idToken: string): Promise<AuthTokens & { user: any }> {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const googleId = decodedToken.uid;
    const email= decodedToken.email;
    const name = decodedToken.name || "Google User";

    if (!email) {
      throw new Error("Email not provided by Google authentication");
    }

    // Check if user exists by googleId or email
    let user = await UserRepository.findByGoogleId(googleId);
    if (!user) {
      user = await UserRepository.findByEmail(email); 
      if (user) {
        // Link Google account to existing user
        user = await UserRepository.update(user.id, {
          googleId,
          isVerified: true,
        });
      } else {
        // Create new user
        user = await UserRepository.create({
          name,
          email,
          googleId,
          userType: "student", 
          isVerified: true,
          isBlocked: false,
        });
      }
    }

    if(!user){
      throw new Error("User not found"); 
    }

    if (user.isBlocked) {
      throw new Error("User is blocked");
    }

    // Generate custom tokens
    const accessToken = generateAccessToken(user.id, user.userType);
    const refreshToken = generateRefreshToken(user.id, user.userType);

    // Store refresh token in Redis
    await redisClient.set(`refresh_token:${user.id}`, refreshToken, {
      EX: 7 * 24 * 60 * 60, // 7 days
    });

    const userResponse: UserResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      isVerified: user.isVerified,
    }

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error("User not found");
    if (user.googleId && !user.password) {
      throw new Error("Use Google authentication to log in; no password to reset");
    }

    const resetToken = uuidv4();
    const resetTokenKey = `reset_token:${user.id}`;
    await redisClient.set(resetTokenKey, resetToken, { EX: 15 * 60 }); // 15 minutes expiry

    // Construct reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`; // e.g., http://localhost:3000/reset-password?token=<token>
    const emailBody = `
      To reset your password, click the link below:\n
      ${resetUrl}\n
      This link expires in 15 minutes. If you didn’t request this, ignore this email.
    `;

    // Send reset email
    await sendOtpEmail(email, emailBody, "Password Reset Request");
    console.log("Password reset token sent:", resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetTokenKeyPrefix = "reset_token:";
    const keys = await redisClient.keys(`${resetTokenKeyPrefix}*`);
    let userId: string | undefined;

    for (const key of keys) {
      const storedToken = await redisClient.get(key);
      if (storedToken === token) {
        userId = key.replace(resetTokenKeyPrefix, "");
        break;
      }
    }

    if (!userId) {
      throw new Error("Invalid or expired reset token");
    }

    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UserRepository.update(userId, { password: hashedPassword });

    await redisClient.del(`reset_token:${userId}`);
  }

}
  



export default new AuthService();
