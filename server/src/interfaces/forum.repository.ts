import { Document } from "mongoose";

export interface IPost {
  _id: string;
  userId: string;
  userName: string;
  content: string;
  topic: string;
  timestamp: Date;
  replies: IReply[];
}

export interface IReply {
  _id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

export interface IForumRepository {
  getPosts(forumId: string): Promise<IPost[]>;
  createPost(forumId: string, post: Omit<IPost, "_id">): Promise<IPost>;
  createReply(forumId: string, postId: string, reply: Omit<IReply, "_id">): Promise<IReply>;
  deletePost(forumId: string, postId: string, userId: string): Promise<void>;
  getPostsByTopic(forumId: string, topic: string): Promise<IPost[]>;
  searchPosts(forumId: string, query: string): Promise<IPost[]>;
}