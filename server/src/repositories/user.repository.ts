import User, { IUser } from "../models/userModel";

class UserRepository {
  async create(userData: Partial<IUser>):Promise<IUser> {
    return await User.create(userData);
  }

  async findByEmail(email: string):Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async findById(userId: string):Promise<IUser | null> {
    return await User.findOne({_id:userId});
  }

  async update(id: string, updateData: Partial<IUser>) {
    return await User.findByIdAndUpdate(id, updateData, { new: true });
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return await User.findOne({ googleId });
  }
}

export default new UserRepository();
