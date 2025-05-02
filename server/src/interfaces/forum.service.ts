import { IForum, IPost, IReply, IPaginated, IFile } from "./forum.model";

export interface IForumService {
  getForums(page: number, pageSize: number, query?: string): Promise<IPaginated<IForum>>;
  getForum(forumId: string): Promise<IForum>;
  createForum(userId: string, title: string, description: string, topics?: string[]): Promise<IForum>;
  updateForum(forumId: string, userId: string, title: string, description: string, topics?: string[]): Promise<IForum>;
  deleteForum(forumId: string, userId: string): Promise<void>;
  getPosts(forumId: string, page: number, pageSize: number): Promise<IPaginated<IPost>>;
  searchPosts(forumId: string, query: string, page: number, pageSize: number): Promise<IPaginated<IPost>>;
  getPost(postId: string): Promise<IPost>;
  createPost(forumId: string, userId: string, userName: string, content: string, topic: string, files?: IFile[]): Promise<IPost>;
  updatePost(postId: string, userId: string, content: string, topic: string, files?: IFile[]): Promise<IPost>;
  deletePost(postId: string, userId: string): Promise<void>;
  getReplies(postId: string, page: number, pageSize: number): Promise<IPaginated<IReply>>;
  createReply(postId: string, userId: string, userName: string, content: string, files?: IFile[], parentReplyId?: string): Promise<IReply>;
  updateReply(replyId: string, userId: string, content: string, files?: IFile[]): Promise<IReply>;
  deleteReply(replyId: string, userId: string): Promise<void>;
}
