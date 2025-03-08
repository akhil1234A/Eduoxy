import { IUser } from "../models/user.model";

export interface IAdminService {
  listStudents(): Promise<IUser[]>;
  listTeachers(): Promise<IUser[]>;
  blockUser(userId: string): Promise<IUser>;
  unblockUser(userId: string): Promise<IUser>;
}