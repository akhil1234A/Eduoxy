import jwt from "jsonwebtoken";
import redis from "../config/redis";

export const generateAccessToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: "7d",
  });
};

export const invalidateRefreshToken = async (userId: string) => {
  await redis.del(`refresh_token:${userId}`); 
};
