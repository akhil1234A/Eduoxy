import { injectable, inject } from "inversify";
import { IForum, IPost, IReply, IPaginated, IFile } from "../interfaces/forum.model";
import { IUserService } from "../interfaces/user.service";
import TYPES from "../di/types";
import { IForumService } from "../interfaces/forum.service";
import { IForumRepository } from "../interfaces/forum.repository";
import { apiLogger } from "../utils/logger";
import { SERVICE_MESSAGES } from "../utils/serviceMessages";


/**
 * This is a service responsible for managing forum functionalities
 * It interacts with the repository layer to perform CRUD operations on forums, posts, and replies
 */
@injectable()
export class ForumService implements IForumService {
  constructor(
    @inject(TYPES.IForumRepository) private repository: IForumRepository,
    @inject(TYPES.IUserService) private userService: IUserService,
  ) {}

  /**
   * This method retrieves a list of forums with pagination and optional search query
   * @param page 
   * @param pageSize 
   * @param query 
   * @returns 
   */
  async getForums(page: number, pageSize: number, query?: string): Promise<IPaginated<IForum>> {
    return this.repository.getForums(page, pageSize, query);
  }


  /**
   * This method creates a new forum
   * @param userId 
   * @param title 
   * @param description 
   * @param topics 
   * @returns 
   */
  async createForum(
    userId: string,
    title: string,
    description: string,
    topics: string[] = []
  ): Promise<IForum> {
    const user = await this.userService.getProfile(userId);
    if (!user) throw new Error(SERVICE_MESSAGES.USER_NOT_FOUND);

    return this.repository.createForum({ title, description, topics });
  }

  /** 
   * This method retrieves a list of posts in a forum with pagination and optional search query
   * @param forumId
   * @param page
   * @param pageSize
   * @returns Promise<IPaginated<IPost>>
   */
  async getPosts(forumId: string, page: number, pageSize: number): Promise<IPaginated<IPost>> {
    return this.repository.getPosts(forumId, page, pageSize);
  }

  /**
   * This method retrieves a list of posts in a forum with pagination and optional search query
   * @param forumId 
   * @param query 
   * @param page 
   * @param pageSize 
   * @returns 
   */
  async searchPosts(
    forumId: string,
    query: string,
    page: number,
    pageSize: number
  ): Promise<IPaginated<IPost>> {
    return this.repository.searchPosts(forumId, query, page, pageSize);
  }

  /**
   * This method retrieves a post by its ID
   * @param postId 
   * @returns 
   */
  async getPost(postId: string): Promise<IPost> {
    return this.repository.getPost(postId);
  }

  /**
   * This method create post in a forum
   * @param forumId 
   * @param userId 
   * @param userName 
   * @param content 
   * @param topic 
   * @param files 
   * @returns 
   */
  async createPost(forumId: string, userId: string, userName: string, content: string, topic: string, files: IFile[] = []): Promise<IPost> {
    if (files && !files.every(file => file.url && file.key)) {
      throw new Error(SERVICE_MESSAGES.INVALID_FILE_META_DATA);
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

  /**
   * This method updates a post in a forum
   * @param postId 
   * @param userId 
   * @param content 
   * @param topic 
   * @param files 
   * @returns 
   */
  async updatePost(postId: string, userId: string, content: string, topic: string, files: IFile[] = []): Promise<IPost> {
    if (files && !files.every(file => file.url && file.key)) {
      throw new Error(SERVICE_MESSAGES.INVALID_FILE_META_DATA);
    }

    return this.repository.updatePost(postId, userId, content, topic, files);
  }

  /**
   * This is a method to delete a post in a forum
   * @param postId 
   * @param userId 
   * @returns 
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    const user = await this.userService.getProfile(userId);
    if (!user) throw new Error(SERVICE_MESSAGES.USER_NOT_FOUND);
    return this.repository.deletePost(postId, userId);
  }

  /**
   * This method retrieves a list of replies to a post with pagination
   * @param postId 
   * @param page 
   * @param pageSize 
   * @returns 
   */
  async getReplies(postId: string, page: number, pageSize: number): Promise<IPaginated<IReply>> {
    return this.repository.getReplyTree(postId, page, pageSize);
  }

  /**
   * This method creates a reply to a post
   * @param postId 
   * @param userId 
   * @param userName 
   * @param content 
   * @param files 
   * @param parentReplyId 
   * @returns 
   */
  async createReply(postId: string | null, userId: string, userName: string, content: string, files: IFile[] = [], parentReplyId?: string): Promise<IReply> {
    if (files && !files.every(file => file.url && file.key)) {
      throw new Error(SERVICE_MESSAGES.INVALID_FILE_META_DATA);
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

  /**
   * This method updates a reply to a post
   * @param replyId 
   * @param userId 
   * @param content 
   * @param files 
   * @returns 
   */
  async updateReply(replyId: string, userId: string, content: string, files: IFile[] = []): Promise<IReply> {
    if (files && !files.every(file => file.url && file.key)) {
      throw new Error(SERVICE_MESSAGES.INVALID_FILE_META_DATA);
    }

    return this.repository.updateReply(replyId, userId, content, files);
  }

  /** 
   * This method deletes a reply to a post
   * @param replyId
   * @param userId
   * @returns Promise<void>
   * @throws Error if the user is not found or the reply does not exist
   */
  async deleteReply(replyId: string, userId: string): Promise<void> {
    const user = await this.userService.getProfile(userId);
    if (!user) throw new Error(SERVICE_MESSAGES.USER_NOT_FOUND);
    return this.repository.deleteReply(replyId, userId);
  }

  /**
   * This method retrieves a forum by its ID
   * @param forumId 
   * @returns 
   */
  async getForum(forumId: string): Promise<IForum> {
    return this.repository.getForum(forumId);
  }

  /** 
   * This method updates a forum
   * @param forumId
   * @param userId
   * @param title
   * @param description
   * @param topics
   * @returns Promise<IForum>
   */
  async updateForum(forumId: string, userId: string, title: string, description: string, topics: string[] = []): Promise<IForum> {
    const user = await this.userService.getProfile(userId);
    if (!user) throw new Error(SERVICE_MESSAGES.USER_NOT_FOUND);

    const forum = await this.repository.getForum(forumId);
    if (!forum) throw new Error(SERVICE_MESSAGES.FORUM_NOT_FOUND);

    return this.repository.updateForum(forumId, { title, description, topics });
  }

  /**
   * This method deletes a forum
   * @param forumId 
   * @param userId 
   * @returns 
   */
  async deleteForum(forumId: string, userId: string): Promise<void> {
    const user = await this.userService.getProfile(userId);
    if (!user) throw new Error(SERVICE_MESSAGES.USER_NOT_FOUND);

    const forum = await this.repository.getForum(forumId);
    if (!forum) throw new Error(SERVICE_MESSAGES.FORUM_NOT_FOUND);

    return this.repository.deleteForum(forumId);
  }
}