import { IUser } from "../models/user.model";

export interface IAdminService {
  listStudents(page: number, limit: number, searchTerm?: string): Promise<{ users: IUser[]; total: number }>;
  listTeachers(page: number, limit: number, searchTerm?: string): Promise<{ users: IUser[]; total: number }>;
  blockUser(userId: string): Promise<IUser>;
  unblockUser(userId: string): Promise<IUser>;
}