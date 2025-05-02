import { injectable, inject } from "inversify";
import { IForum, IPost, IReply, IPaginated, IFile } from "../interfaces/forum.model";
import { IUserService } from "../interfaces/user.service";
import TYPES from "../di/types";
import { IForumService } from "../interfaces/forum.service";
import { IForumRepository } from "../interfaces/forum.repository";
import { apiLogger } from "../utils/logger";
import mongoose from "mongoose";

@injectable()
export class ForumService implements IForumService {
  constructor(
    @inject(TYPES.IForumRepository) private repository: IForumRepository,
    @inject(TYPES.IUserService) private userService: IUserService,
  ) {}

  async getForums(page: number, pageSize: number, query?: string): Promise<IPaginated<IForum>> {
    return this.repository.getForums(page, pageSize, query);
  }

  async createForum(
    userId: string,
    title: string,
    description: string,
    topics: string[] = []
  ): Promise<IForum> {
    const user = await this.userService.getProfile(userId);
    if (!user) throw new Error("User not found");

    return this.repository.createForum({ title, description, topics });
  }

  async getPosts(forumId: string, page: number, pageSize: number): Promise<IPaginated<IPost>> {
    return this.repository.getPosts(forumId, page, pageSize);
  }

  async searchPosts(
    forumId: string,
    query: string,
    page: number,
    pageSize: number
  ): Promise<IPaginated<IPost>> {
    return this.repository.searchPosts(forumId, query, page, pageSize);
  }

  async getPost(postId: string): Promise<IPost> {
    return this.repository.getPost(postId);
  }

  async createPost(forumId: string, userId: string, userName: string, content: string, topic: string, files: IFile[] = []): Promise<IPost> {
    if (files && !files.every(file => file.url && file.key)) {
      throw new Error("Invalid file metadata: url and key are required");
    }

    return this.repository.createPost({
      forumId,
      userId,
      userName,
      content,
      topic,
      files,
    });
  }

  async updatePost(postId: string, userId: string, content: string, topic: string, files: IFile[] = []): Promise<IPost> {
    if (files && !files.every(file => file.url && file.key)) {
      throw new Error("Invalid file metadata: url and key are required");
    }

    return this.repository.updatePost(postId, userId, content, topic, files);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const user = await this.userService.getProfile(userId);
    if (!user) throw new Error("User not found");
    return this.repository.deletePost(postId, userId);
  }

  async getReplies(postId: string, page: number, pageSize: number): Promise<IPaginated<IReply>> {
    return this.repository.getReplyTree(postId, page, pageSize);
  }

  async createReply(postId: string | null, userId: string, userName: string, content: string, files: IFile[] = [], parentReplyId?: string): Promise<IReply> {
    if (files && !files.every(file => file.url && file.key)) {
      throw new Error("Invalid file metadata: url and key are required");
    }

    let finalPostId = postId;
    if (parentReplyId) {
      const parentReply = await this.repository.getReply(parentReplyId);
      if (!parentReply) throw new Error("Parent reply not found");
      finalPostId = parentReply.postId;
    }

    if (!finalPostId) throw new Error("Post ID is required");

    return this.repository.createReply({
      postId: finalPostId,
      userId,
      userName,
      content,
      files,
      parentReplyId: parentReplyId || null,
    });
  }

  async updateReply(replyId: string, userId: string, content: string, files: IFile[] = []): Promise<IReply> {
    if (files && !files.every(file => file.url && file.key)) {
      throw new Error("Invalid file metadata: url and key are required");
    }

    return this.repository.updateReply(replyId, userId, content, files);
  }

  async deleteReply(replyId: string, userId: string): Promise<void> {
    const user = await this.userService.getProfile(userId);
    if (!user) throw new Error("User not found");
    return this.repository.deleteReply(replyId, userId);
  }

  async getForum(forumId: string): Promise<IForum> {
    return this.repository.getForum(forumId);
  }

  async updateForum(forumId: string, userId: string, title: string, description: string, topics: string[] = []): Promise<IForum> {
    const user = await this.userService.getProfile(userId);
    if (!user) throw new Error("User not found");

    const forum = await this.repository.getForum(forumId);
    if (!forum) throw new Error("Forum not found");

    return this.repository.updateForum(forumId, { title, description, topics });
  }

  async deleteForum(forumId: string, userId: string): Promise<void> {
    const user = await this.userService.getProfile(userId);
    if (!user) throw new Error("User not found");

    const forum = await this.repository.getForum(forumId);
    if (!forum) throw new Error("Forum not found");

    return this.repository.deleteForum(forumId);
  }
}