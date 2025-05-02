import { IForum, IPost, IReply, IPaginated, IFile } from "./forum.model";

export interface IForumRepository {
  getForums(page: number, pageSize: number, query?: string): Promise<IPaginated<IForum>>;
  createForum(data: Partial<IForum>): Promise<IForum>;
  getForum(forumId: string): Promise<IForum>;
  updateForum(forumId: string, data: Partial<IForum>): Promise<IForum>;
  deleteForum(forumId: string): Promise<void>;
  getPosts(forumId: string, page: number, pageSize: number): Promise<IPaginated<IPost>>;
  searchPosts(forumId: string, query: string, page: number, pageSize: number): Promise<IPaginated<IPost>>;
  getPost(postId: string): Promise<IPost>;
  createPost(data: Partial<IPost>): Promise<IPost>;
  updatePost(postId: string, userId: string, content: string, topic: string, files: IFile[]): Promise<IPost>;
  deletePost(postId: string, userId: string): Promise<void>;
  getReplyTree(postId: string, page: number, pageSize: number): Promise<IPaginated<IReply>>;
  createReply(data: Partial<IReply>): Promise<IReply>;
  updateReply(replyId: string, userId: string, content: string, files: IFile[]): Promise<IReply>;
  deleteReply(replyId: string, userId: string): Promise<void>;
  getReply(replyId: string): Promise<IReply>;
}
