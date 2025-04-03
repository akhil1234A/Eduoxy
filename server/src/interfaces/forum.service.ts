import { IUserService } from "./user.service";

export interface IForumService {
  getPosts(forumId: string): Promise<any>;
  createPost(forumId: string, userId: string, content: string, topic: string): Promise<any>;
  createReply(forumId: string, postId: string, userId: string, content: string): Promise<any>;
  getPostsByTopic(forumId: string, topic: string): Promise<any>;
  searchPosts(forumId: string, query: string): Promise<any>;
  deletePost(forumId: string, postId: string, userId: string): Promise<void>;
}