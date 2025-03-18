import { injectable, inject } from "inversify";
import { IUserService } from "../interfaces/user.service";
import { IUserRepository } from "../interfaces/user.repository";
import TYPES from "../di/types";
import bcrypt from "bcryptjs";

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository
  ) {}

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    if (!user.password) throw new Error("User does not have a password");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Current password is incorrect");

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) throw new Error("New password cannot be the same as the old password");

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { password: hashedNewPassword });
  }
}
