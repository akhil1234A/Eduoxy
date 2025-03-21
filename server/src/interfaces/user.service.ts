import { IUser } from "../models/user.model";

export interface IUserService {
  updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
  updateInstructorProfile(userId: string, name?: string, title?: string, bio?: string, profileImage?: Express.Multer.File): Promise<IUser>;
  getProfile(userId: string): Promise<IUser>;
}

