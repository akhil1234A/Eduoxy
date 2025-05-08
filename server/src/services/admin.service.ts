import { IAdminService } from "../interfaces/admin.service";
import { IUserRepository } from "../interfaces/user.repository";
import { IUser } from "../models/user.model";
import { UserRole } from "../types/types";
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { CacheUtil } from "../utils/cache";
import { IRedisClient } from "../config/redis";

/**
 * This is a service responsible for managing admin functionalities
 */
@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
    @inject(TYPES.IRedisClient) private _redisClient: IRedisClient
  ) {}

  /**
   * This method retrieves a list of students with pagination and search functionality
   * @param page 
   * @param limit 
   * @param searchTerm 
   * @returns 
   */
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
  
  /**
   * This method retrives a list of teachers with pagination and search 
   * Admin Management - list Teachers 
   * @param page 
   * @param limit 
   * @param searchTerm 
   * @returns 
   */
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

  /**
   * Admin Management - block user
   * @param userId 
   * @returns 
   */
  async blockUser(userId: string): Promise<IUser> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    if (user.userType === "admin") throw new Error("Cannot block an admin");

    const success = await this._userRepository.blockUser(userId);
    if (!success) throw new Error("Failed to block user");

    // Invalidate all paginated caches for both students and teachers lists
    const studentKeysPattern = "list:students*";
    const teacherKeysPattern = "list:teachers*";
    
    const keysToDelete = await Promise.all([
      this._redisClient.keys(studentKeysPattern),
      this._redisClient.keys(teacherKeysPattern)
    ]);

    const allKeys = keysToDelete.flat();
    if (allKeys.length > 0) {
      await Promise.all(allKeys.map(key => this._redisClient.del(key)));
    }

    const updatedUser = await this._userRepository.findById(userId);
    if (!updatedUser) throw new Error("User not found after update");
    return updatedUser;
  }


  /**
   * Admin Management - Unblock a user
   * @param userId 
   * @returns 
   */
  async unblockUser(userId: string): Promise<IUser> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const success = await this._userRepository.unblockUser(userId);
    if (!success) throw new Error("Failed to unblock user");

    // Invalidate all paginated caches for both students and teachers lists
    const studentKeysPattern = "list:students*";
    const teacherKeysPattern = "list:teachers*";
    
    const keysToDelete = await Promise.all([
      this._redisClient.keys(studentKeysPattern),
      this._redisClient.keys(teacherKeysPattern)
    ]);

    const allKeys = keysToDelete.flat();
    if (allKeys.length > 0) {
      await Promise.all(allKeys.map(key => this._redisClient.del(key)));
    }

    const updatedUser = await this._userRepository.findById(userId);
    if (!updatedUser) throw new Error("User not found after update");
    return updatedUser;
  }
}

export default AdminService;