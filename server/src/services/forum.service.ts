import { IForumService } from "../interfaces/forum.service";
import { IForumRepository } from "../interfaces/forum.repository";
import { IUserService } from "../interfaces/user.service";

export class ForumService implements IForumService {
  constructor(
    private forumRepository: IForumRepository,
    private userService: IUserService
  ) {}

  async getPosts(forumId: string) {
    console.log(`Getting posts for forum ${forumId}`);
    return this.forumRepository.getPosts(forumId);
  }

  async createPost(forumId: string, userId: string, content: string, topic: string) {
    try {
      const user = await this.userService.getProfile(userId);
      console.log(`User profile for ${userId}:`, user);
      const post = {
        userId,
        userName: user?.name || userId, // Fallback to userId if name is unavailable
        content,
        topic,
        timestamp: new Date(),
        replies: [],
      };
      return this.forumRepository.createPost(forumId, post);
    } catch (error) {
      console.error(`Error creating post for user ${userId} in forum ${forumId}:`, error);
      throw error;
    }
  }

  async createReply(forumId: string, postId: string, userId: string, content: string) {
    try {
      const user = await this.userService.getProfile(userId);
      console.log(`User profile for ${userId}:`, user);
      const reply = {
        userId,
        userName: user?.name || userId,
        content,
        timestamp: new Date(),
      };
      return this.forumRepository.createReply(forumId, postId, reply);
    } catch (error) {
      console.error(`Error creating reply for user ${userId} in forum ${forumId}:`, error);
      throw error;
    }
  }

  async deletePost(forumId: string, postId: string, userId: string) {
    const posts = await this.forumRepository.getPosts(forumId);
    const post = posts.find((p) => p._id === postId);
    if (!post) throw new Error("Post not found");
    if (post.userId !== userId) throw new Error("You can only delete your own posts");
    await this.forumRepository.deletePost(forumId, postId, userId);
  }

  async getPostsByTopic(forumId: string, topic: string) {
    return this.forumRepository.getPostsByTopic(forumId, topic);
  }

  async searchPosts(forumId: string, query: string) {
    return this.forumRepository.searchPosts(forumId, query);
  }
}