import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  userType: "student" | "admin" | "teacher";
  isVerified: Boolean
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    userType: { type: String, enum: ["student", "admin", "teacher"], required: true },
    isVerified: {type: Boolean}
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
