import { IAdminService } from "../interfaces/admin.service";
import { IUserRepository } from "../interfaces/user.repository";
import { IUser } from "../models/user.model";
import { UserRole } from "../types/types";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
@injectable()
export class AdminService implements IAdminService {
  constructor(@inject(TYPES.IUserRepository) private userRepository: IUserRepository) {}

  async listStudents(): Promise<IUser[]> {
    return this.userRepository.listByUserType(UserRole.STUDENT);
  }

  async listTeachers(): Promise<IUser[]> {
    return this.userRepository.listByUserType(UserRole.TEACHER);
  }

  async blockUser(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    if (user.userType === "admin") throw new Error("Cannot block an admin");

    const success = await this.userRepository.blockUser(userId);
    if (!success) throw new Error("Failed to block user");

    const updatedUser = await this.userRepository.findById(userId);
    if (!updatedUser) throw new Error("User not found after update");
    return updatedUser;
  }

  async unblockUser(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const success = await this.userRepository.unblockUser(userId);
    if (!success) throw new Error("Failed to unblock user");

    const updatedUser = await this.userRepository.findById(userId);
    if (!updatedUser) throw new Error("User not found after update");
    return updatedUser;
  }
}

export default AdminService;