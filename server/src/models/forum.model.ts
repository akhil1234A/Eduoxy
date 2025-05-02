import mongoose, { Schema } from "mongoose";
import { IFile, IPost, IReply, IForum } from "../interfaces/forum.model";

const FileSchema = new Schema({
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number },
  name: { type: String },
});

const PostSchema = new Schema({
  forumId: { type: Schema.Types.ObjectId, ref: "Forum", required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  topic: { type: String, required: true, index: true },
  files: [FileSchema],
}, { timestamps: true });




const ReplySchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  parentReplyId: { type: Schema.Types.ObjectId, ref: "Reply", default: null, index:true },
  files: [FileSchema],
}, { timestamps: true });

const ForumSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  topics: [{ type: String }],
}, { timestamps: true });

ForumSchema.index({ title: "text", description: "text" });

export const Forum = mongoose.model<IForum>("Forum", ForumSchema);
export const Post = mongoose.model<IPost>("Post", PostSchema);
export const Reply = mongoose.model<IReply>("Reply", ReplySchema);