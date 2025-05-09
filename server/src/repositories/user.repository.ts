import { IUserRepository } from "../interfaces/user.repository";
import { BaseRepository } from "./base.repository";
import User, { IUser, UserInput } from "../models/user.model";
import { injectable } from "inversify";
import TYPES from "../di/types";
import { inject } from "inversify";
import { FilterQuery, Model } from "mongoose";

/**
 * This is a repository responsible for interacting with user repository
 * Managing user data and authentication
 */
@injectable()
export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor(@inject(TYPES.UserModel) private userModel: Model<IUser>) {
    super(userModel);
  }

  /**
   * This method creates a new user in the database
   * @param data - User data to be created
   * @returns Created user object
   */
  async create(data: UserInput): Promise<IUser> {
    return this.userModel.create(data);
  }

  /**
   * This method retrieves a user by their email address
   * @param email - Email address of the user to be retrieved
   * @returns User object if found, null otherwise
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * This method retrieves a user by their Google ID
   * @param googleId - Google ID of the user to be retrieved
   * @returns User object if found, null otherwise
   */
  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  /**
   * This method blocks a user 
   * @param id - ID of the user to be blocked
   */
  async blockUser(id: string): Promise<boolean> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { isBlocked: true }, { new: true })
      .select("-password") 
      .exec();
    return updatedUser !== null;
  }

  /**
   * This method unblocks a user 
   * @param id 
   * @returns 
   */
  async unblockUser(id: string): Promise<boolean> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { isBlocked: false }, { new: true })
      .select("-password") 
      .exec();
    return updatedUser !== null;
  }

/**
 * This method retrieves a list of users by their user type (student, teacher, admin)
 * @param userType 
 * @param skip 
 * @param limit 
 * @param searchTerm 
 * @returns 
 */
  async listByUserType(
    userType: "student" | "teacher" | "admin",
    skip: number = 0,
    limit: number = 10,
    searchTerm: string = ""
  ): Promise<IUser[]> {
    const query: FilterQuery<IUser> = { userType };
    
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    return this.userModel
      .find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .exec();
  }

  /**
   * This method exists for pagination purpose, count the number of users by user type
   * @param userType 
   * @param searchTerm 
   * @returns 
   */
  async countByUserType(userType: "student" | "teacher" | "admin", searchTerm: string = ""): Promise<number> {
    const query: FilterQuery<IUser> = { userType };
    
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    return this.userModel.countDocuments(query).exec();
  }

  /**
   * This method retrieves a user by their ID
   * @param id - ID of the user to be retrieved
   * @param select - Fields to be selected in the result
   * @returns User object if found, null otherwise
   */
  async findById(id: string, select="-password"): Promise<IUser | null> {
    return this.userModel.findById(id).select(select).exec();
  }

  /**
   * This method updates a user 
   * @param id 
   * @param user 
   * @param select 
   * @returns 
   */
  async update(id: string, user: Partial<IUser>, select=""): Promise<IUser | null> {
    return this.userModel.findByIdAndUpdate(id, user, { new: true }).select(select).exec();
  }
}