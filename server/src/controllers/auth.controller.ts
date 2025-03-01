import { Request, Response } from "express";
import AuthService from "../services/auth.service";
import { AuthRequest } from "../types/types";

export const signUp = async (req: Request, res: Response) => {
  try {
    const { name, email, password, userType } = req.body;
    const user = await AuthService.signUp(name, email, password, userType);

    await AuthService.sendOtp(email);
    
    res.status(201).json({ message: "User registered. OTP sent to email." });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const tokens = await AuthService.login(email, password);
    res.json(tokens);
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};


export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    await AuthService.verifyOtp(email, otp);

    res.json({ message: "OTP verified successfully. You can now log in." });
  } catch (error:any) {
    res.status(400).json({ error: error.message });
  }
};


// export const logout = async (req: AuthRequest, res: Response)=>{
//   try {
//     const userId = req.user.id; 
//     await AuthService.logout(userId);
//     res.status(200).json({ message: "Logged out successfully" });
//   } catch (error:any) {
//     res.status(500).json({ message: "Logout failed", error: error.message });
//   }
// }