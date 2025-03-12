import jwt from "jsonwebtoken";
import { injectable } from "inversify";

export interface IJwtService {
  generateAccessToken(userId: string, userType: string): string;
  generateRefreshToken(userId: string, userType: string): string;
  verifyRefreshToken(token: string): { userId: string; userType: string };
}

@injectable()
export class JwtService implements IJwtService {
  generateAccessToken(userId: string, userType: string): string {
    return jwt.sign({ userId, userType }, process.env.JWT_SECRET!, { expiresIn: "15m" });
  }

  generateRefreshToken(userId: string, userType: string): string {
    return jwt.sign({ userId, userType }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
  }

  verifyRefreshToken(token: string): { userId: string; userType: string } {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string; userType: string };
  }
}

export const jwtService = new JwtService();
export const generateAccessToken = jwtService.generateAccessToken.bind(jwtService);
export const generateRefreshToken = jwtService.generateRefreshToken.bind(jwtService);
export const verifyRefreshToken = jwtService.verifyRefreshToken.bind(jwtService);