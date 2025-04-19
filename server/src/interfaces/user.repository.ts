import { IBaseRepository } from "./base.repository";
import { IUser, UserInput } from "../models/user.model";
import { UserRole } from "../types/types";

export interface IUserRepository extends IBaseRepository<IUser> {
  create(data: UserInput): Promise<IUser>;
  findByEmail(email: string): Promise<IUser | null>;
  findByGoogleId(googleId: string): Promise<IUser | null>;
  blockUser(id: string): Promise<boolean>;
  unblockUser(id: string): Promise<boolean>;
  listByUserType(userType: UserRole, skip: number, limit: number, searchTerm?: string): Promise<IUser[]>
  countByUserType(userType: UserRole, searchTerm?: string): Promise<number>
  findById(id: string, select?: string): Promise<IUser | null>;
  update(id: string, user: Partial<IUser>, select?: string): Promise<IUser | null>;
}