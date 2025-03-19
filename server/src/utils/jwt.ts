import jwt from "jsonwebtoken";
import { injectable, inject } from "inversify";
import { IRedisClient } from "../config/redis";
import TYPES from "../di/types";

export interface IJwtService {
  generateAccessToken(userId: string, userType: string): string;
  generateRefreshToken(userId: string, userType: string): string;
  verifyRefreshToken(token: string): { userId: string; userType: string };
  verifyAccessToken(token: string): { userId: string; userType: string; exp: number };
  blacklistToken(token: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
}

@injectable()
export class JwtService implements IJwtService {
  constructor(@inject(TYPES.IRedisClient) private _redisClient: IRedisClient) {}
  generateAccessToken(userId: string, userType: string): string {
    return jwt.sign({ userId, userType }, process.env.JWT_SECRET!, { expiresIn: "30m" });
  }

  generateRefreshToken(userId: string, userType: string): string {
    return jwt.sign({ userId, userType }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
  }

  verifyRefreshToken(token: string): { userId: string; userType: string } {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string; userType: string };
  }
  verifyAccessToken(token: string): { userId: string; userType: string; exp: number } {
    return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; userType: string; exp: number };
  }

  async blacklistToken(token: string): Promise<void> {
    const decoded = this.verifyAccessToken(token); 
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000); 
    await this._redisClient.set(`blacklist:${token}`, "true", { EX: expiresIn });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this._redisClient.get(`blacklist:${token}`);
    return result === "true";
  }
}

