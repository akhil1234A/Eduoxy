import { IBaseRepository } from "./base.repository";
import { IUser, UserInput } from "../models/user.model";

export interface IUserRepository extends IBaseRepository<IUser> {
  create(data: UserInput): Promise<IUser>;
  findByEmail(email: string): Promise<IUser | null>;
  findByGoogleId(googleId: string): Promise<IUser | null>;
  blockUser(id: string): Promise<boolean>;
  unblockUser(id: string): Promise<boolean>;
  listByUserType(userType: "student" | "teacher" | "admin"): Promise<IUser[]>
}