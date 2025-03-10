import mongoose, { Schema, Document } from "mongoose";
import { UserRole } from "../types/types";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?:string;
  userType: UserRole;
  isVerified: boolean;
  isBlocked: boolean; 
}

export interface UserInput {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  userType: UserRole;
  isVerified?: boolean;
  isBlocked?: boolean;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true },
    userType: { type: String, enum: Object.values(UserRole), required: true },
    isVerified: {type: Boolean, default: false},
    isBlocked: {type: Boolean, default: false},
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
