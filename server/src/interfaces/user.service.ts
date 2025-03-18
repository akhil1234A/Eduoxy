import { IUser } from "../models/user.model";

export interface IUserService {
  updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}

