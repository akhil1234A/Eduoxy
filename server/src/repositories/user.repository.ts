import { IUserRepository } from "../interfaces/user.repository";
import { BaseRepository } from "./base.repository";
import User, { IUser, UserInput } from "../models/user.model";
import { injectable } from "inversify";
import TYPES from "../di/types";
import { inject } from "inversify";

@injectable()
export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor(@inject(TYPES.UserModel) private _userModel: typeof User) {
    super(_userModel);
  }

  async create(data: UserInput): Promise<IUser> {
    return this._userModel.create(data);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this._userModel.findOne({ email }).exec();
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return this._userModel.findOne({ googleId }).exec();
  }

  async blockUser(id: string): Promise<boolean> {
    const updatedUser = await this._userModel
      .findByIdAndUpdate(id, { isBlocked: true }, { new: true })
      .select("-password") 
      .exec();
    return updatedUser !== null;
  }

  async unblockUser(id: string): Promise<boolean> {
    const updatedUser = await this._userModel
      .findByIdAndUpdate(id, { isBlocked: false }, { new: true })
      .select("-password") 
      .exec();
    return updatedUser !== null;
  }

  async listByUserType(
    userType: "student" | "teacher" | "admin",
    skip: number = 0,
    limit: number = 10,
    searchTerm: string = ""
  ): Promise<IUser[]> {
    const query: any = { userType };
    
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    return this._userModel
      .find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countByUserType(userType: "student" | "teacher" | "admin", searchTerm: string = ""): Promise<number> {
    const query: any = { userType };
    
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }
    
    return this._userModel.countDocuments(query).exec();
  }

  async findById(id: string, select="-password"): Promise<IUser | null> {
    return this._userModel.findById(id).select(select).exec();
  }

  async update(id: string, user: Partial<IUser>, select=""): Promise<IUser | null> {
    return this._userModel.findByIdAndUpdate(id, user, { new: true }).select(select).exec();
  }
}