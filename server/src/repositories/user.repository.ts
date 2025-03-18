import { IUserRepository } from "../interfaces/user.repository";
import { BaseRepository } from "./base.repository";
import User, { IUser, UserInput } from "../models/user.model";
import { injectable } from "inversify";
import TYPES from "../di/types";
import { inject } from "inversify";
@injectable()
export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor(@inject(TYPES.UserModel) private userModel: typeof User) {
    super(User);
  }

  async create(data: UserInput): Promise<IUser> {
    return this.model.create(data);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({ email }).exec();
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return this.model.findOne({ googleId }).exec();
  }

  async blockUser(id: string): Promise<boolean> {
    const updatedUser = await this.model.findByIdAndUpdate(id, { isBlocked: true }, { new: true }).exec();
    return updatedUser !== null;
  }

  async unblockUser(id: string): Promise<boolean> {
    const updatedUser = await this.model.findByIdAndUpdate(id, { isBlocked: false }, { new: true }).exec();
    return updatedUser !== null;
  }

  async listByUserType(userType: "student" | "teacher" | "admin"): Promise<IUser[]> {
    return this.model.find({ userType }).exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  async update(id: string, user: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, user, { new: true }).exec();
  }
}