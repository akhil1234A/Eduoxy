import mongoose, { Schema } from "mongoose";

const ReplySchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const PostSchema = new Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  topic: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  replies: [ReplySchema],
});

const ForumSchema = new Schema({
  forumId: { type: String, required: true, unique: true },
  posts: [PostSchema],
});

export const Forum = mongoose.model("Forum", ForumSchema);