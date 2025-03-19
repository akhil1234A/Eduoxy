import { injectable, inject } from "inversify";
import { IUserService } from "../interfaces/user.service";
import { IUserRepository } from "../interfaces/user.repository";
import TYPES from "../di/types";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";
import { IUser } from "../models/user.model";
import fs from "fs";
@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository
  ) {
     cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error("User not found");
    if (!user.password) throw new Error("User does not have a password");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Current password is incorrect");

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) throw new Error("New password cannot be the same as the old password");

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this._userRepository.update(userId, { password: hashedNewPassword });
  }

  async updateInstructorProfile(userId: string, title?: string, bio?: string, profileImage?: Express.Multer.File): Promise<IUser> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const updates: Partial<IUser> = {};

    if (title) updates.title = title;
    if (bio) updates.bio = bio;
    if (profileImage) {
      try {
        const result = await cloudinary.v2.uploader.upload(profileImage.path, {
          folder: "profile-images",
          public_id: `${user._id}-profile`,
          transformation: [{ width: 500, height: 500, crop: "fill" }],
          overwrite: true,
      });
      updates.profileImage = result.secure_url;
    } finally {
      fs.unlink(profileImage.path, (err) => {
        if (err) console.error("Error deleting profile image", err);
      });
    }
    }

    const updatedUser = await this._userRepository.update(userId, updates);
    if (!updatedUser) throw new Error("Failed to update profile");
    return updatedUser as IUser;
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await this._userRepository.findById(userId);
    if(!user) throw new Error("User not found");
    return user as IUser; 
  }

}
