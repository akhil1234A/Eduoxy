import { Request, Response } from "express";

export default interface IAuthController {
  signUp(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  verifyOtp(req: Request, res: Response): Promise<void>;
  refresh(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  googleAuth(req: Request, res: Response): Promise<void>;
  requestPasswordReset(req: Request, res: Response): Promise<void>;
  resetPassword(req: Request, res: Response): Promise<void>;
  sendOtp(req: Request, res: Response): Promise<void>;
}