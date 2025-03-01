import User, { IUser } from "../models/userModel";

class UserRepository {
  async create(userData: Partial<IUser>) {
    return await User.create(userData);
  }

  async findByEmail(email: string) {
    return await User.findOne({ email });
  }

  async update(id: string, updateData: Partial<IUser>) {
    return await User.findByIdAndUpdate(id, updateData, { new: true });
  }
}

export default new UserRepository();
