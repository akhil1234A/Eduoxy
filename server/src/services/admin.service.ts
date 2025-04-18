import { IAdminService } from "../interfaces/admin.service";
import { IUserRepository } from "../interfaces/user.repository";
import { IUser } from "../models/user.model";
import { UserRole } from "../types/types";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { CacheUtil } from "../utils/cache";
@injectable()
export class AdminService implements IAdminService {
  constructor(@inject(TYPES.IUserRepository) private _userRepository: IUserRepository) {}

  async listStudents(page: number = 1, limit: number = 10, searchTerm: string = ""): Promise<{ users: IUser[]; total: number }> {
    const cacheKey = CacheUtil.getListCacheKey("students", page, limit, searchTerm);
    const cachedData = await CacheUtil.get<{ users: IUser[]; total: number }>(cacheKey);
    if (cachedData) return cachedData;
  
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this._userRepository.listByUserType(UserRole.STUDENT, skip, limit, searchTerm),
      this._userRepository.countByUserType(UserRole.STUDENT, searchTerm),
    ]);
  
    const result = { users, total };
    await CacheUtil.set(cacheKey, result, 300); // Cache for 5 minutes
    return result;
  }
  
  async listTeachers(page: number = 1, limit: number = 10, searchTerm: string = ""): Promise<{ users: IUser[]; total: number }> {
    const cacheKey = CacheUtil.getListCacheKey("teachers", page, limit, searchTerm);
    const cachedData = await CacheUtil.get<{ users: IUser[]; total: number }>(cacheKey);
    if (cachedData) return cachedData;
  
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this._userRepository.listByUserType(UserRole.TEACHER, skip, limit, searchTerm),
      this._userRepository.countByUserType(UserRole.TEACHER, searchTerm),
    ]);
  
    const result = { users, total };
    await CacheUtil.set(cacheKey, result, 300); // Cache for 5 minutes
    return result;
  }

  async blockUser(userId: string): Promise<IUser> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    if (user.userType === "admin") throw new Error("Cannot block an admin");

    const success = await this._userRepository.blockUser(userId);
    if (!success) throw new Error("Failed to block user");

    const updatedUser = await this._userRepository.findById(userId);
    if (!updatedUser) throw new Error("User not found after update");
    return updatedUser;
  }

  async unblockUser(userId: string): Promise<IUser> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const success = await this._userRepository.unblockUser(userId);
    if (!success) throw new Error("Failed to unblock user");

    const updatedUser = await this._userRepository.findById(userId);
    if (!updatedUser) throw new Error("User not found after update");
    return updatedUser;
  }
}

export default AdminService;