import bcrypt from "bcryptjs";
import redis from "../config/redis"
import jwt from "jsonwebtoken";
import UserRepository from "../repositories/user.repository";
import { sendOtpEmail } from "../utils/mail";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";

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

  async login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) throw new Error("Invalid credentials");
    if (!user.isVerified) throw new Error("Account not verified. Please verify OTP.");

    const loginAttempts = await redis.get(`login_attempts:${email}`);
    if (loginAttempts && parseInt(loginAttempts) >= 5) {
      throw new Error("Too many failed login attempts. Try again later.");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
   
    await redis.set(`refresh_token:${user.id}`, refreshToken, "EX", 7 * 24 * 60 * 60); 

    return { accessToken, refreshToken };
  }

  async sendOtp(email: string) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error("User not found");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    //5 Minutes
    await redis.set(`otp:${email}`, otp, "EX", 300);

    await sendOtpEmail(email, otp);
  }

  async verifyOtp(email: string, otp: string) {
    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) throw new Error("Invalid or expired OTP");

    await redis.del(`otp:${email}`); 

    
    const user = await UserRepository.findByEmail(email);
    if (user) {
      await UserRepository.update(user.id, { isVerified: true });
    }
    
    return true;
  }

  async logout(userId: string) {
    await redis.del(`refresh_token:${userId}`);
  }
  
}


export default new AuthService();
