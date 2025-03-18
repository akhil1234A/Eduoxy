import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { Request, Response } from "express";
import { IUserService } from "../interfaces/user.service";

@injectable()
export class UserController {
  constructor(
    @inject(TYPES.IUserService) private userService: IUserService
  ) {}

  async updatePassword(req: Request, res: Response): Promise<void> {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    try {
      await this.userService.updatePassword(userId, currentPassword, newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to update password" 
      });
    }
  }
}