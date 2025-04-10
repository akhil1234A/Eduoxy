import { Request, Response } from "express";


export const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }, user: { id: string; userType: string, userName: string }) => {
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions: import("express").CookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
  };

  res.cookie("accessToken", tokens.accessToken, { ...cookieOptions, maxAge: 12 * 60 * 60 * 1000 });
  res.cookie("refreshToken", tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  // httopOnly false accessible on client side )
  res.cookie("userId", user.id, { ...cookieOptions, httpOnly: false, maxAge: 12 * 60 * 60 * 1000 });
  res.cookie("userType", user.userType, { ...cookieOptions, httpOnly: false, maxAge: 12 * 60 * 60 * 1000 });
  res.cookie("userName", user.userName, { ...cookieOptions, httpOnly: false, maxAge: 12 * 60 * 60 * 1000 });
};