import { injectable, inject } from "inversify";
import { IUserService } from "../interfaces/user.service";
import { IUserRepository } from "../interfaces/user.repository";
import TYPES from "../di/types";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";
import { IUser } from "../models/user.model";
import fs from "fs";
import { S3Service } from "./s3.service";

/**
 * This is a service class for handling user-related operations.
 * It provides methods to update user password, update instructor profile, and get user profile.
 */
@injectable()
export class UserService implements IUserService {

  private s3Service: S3Service;
  constructor(
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
    
  ) {
    this.s3Service = new S3Service();
  }

  /**
   * This method updates the password of a user.
   * @param userId 
   * @param currentPassword 
   * @param newPassword 
   */
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

  /**
   * This method updates the profile of an instructor.
   * @param userId 
   * @param name 
   * @param title 
   * @param bio 
   * @param profileImage 
   * @returns 
   */
  async updateInstructorProfile(userId: string, name?: string, title?: string, bio?: string, profileImage?: Express.Multer.File): Promise<IUser> {
    const user = await this._userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const updates: Partial<IUser> = {};

    if (name) updates.name = name;
    if (title) updates.title = title;
    if (bio) updates.bio = bio;
    
    if (profileImage) {
      try {
        if (user.profileImage) {
          const previousKey = this.s3Service.extractKeyFromUrl(user.profileImage);
          if (previousKey) {
            await this.s3Service.deleteObject(previousKey);
          } else {
            console.warn(`Could not extract key from previous profile image URL: ${user.profileImage}`);
          }
        }

        
        const fileName = `${user._id}-profile-${Date.now()}.${profileImage.originalname.split(".").pop()}`;
        const { url: presignedUrl, publicUrl } = await this.s3Service.generatePresignedUrl("image", fileName);

        
        const response = await fetch(presignedUrl, {
          method: "PUT",
          body: fs.readFileSync(profileImage.path),
          headers: {
            "Content-Type": profileImage.mimetype,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to upload image to S3");
        }

        
        updates.profileImage = publicUrl;
      } finally {
        
        fs.unlink(profileImage.path, (err) => {
          if (err) console.error("Error deleting profile image", err);
        });
      }
    }

    const updatedUser = await this._userRepository.update(userId, updates, "-password");
    if (!updatedUser) throw new Error("Failed to update profile");
    return updatedUser as IUser;
  }

  /**
   * This method retrieves the profile of a user by their ID.
   * @param userId 
   * @returns 
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await this._userRepository.findById(userId, "-password");
    if(!user) throw new Error("User not found");
    return user as IUser; 
  }

}
