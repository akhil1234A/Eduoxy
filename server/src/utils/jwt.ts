import jwt from "jsonwebtoken";
import redis from "../config/redis";

export const generateAccessToken = (userId: string, userType: string) => {
  return jwt.sign({ userId, userType }, process.env.ACCESS_TOKEN_SECRET as string, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (userId: string, userType: string) => {
  return jwt.sign({ userId, userType }, process.env.REFRESH_TOKEN_SECRET as string, {
    expiresIn: "7d",
  });
};

export const invalidateRefreshToken = async (userId: string) => {
  await redis.del(`refresh_token:${userId}`); 
};



export const verifyRefreshToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || "cat") as { userId: string, userType:string };    
    return {userId: decoded.userId, userType: decoded.userType};
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};