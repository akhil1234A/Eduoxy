import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import { ForumService } from "../services/forum.service";
import TYPES from "../di/types";
import { successResponse, errorResponse } from "../types/types";
import { IForumService } from "../interfaces/forum.service";
import { HttpStatus } from "../utils/httpStatus";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
import { apiLogger } from "../utils/logger";
import { buildPaginationResult, getPaginationParams } from "../utils/paginationUtil";

/**
 * This controller handles all the CRUD operations for forums, posts, and replies.
 */

@injectable()
export class ForumController {
  constructor(
    @inject(TYPES.IForumService) private _forumService: IForumService,
  ) {}

/**
 * This method get all forums with pagination and optional search query
 * @param req request object
 * @param res 
 */
  async getForums(req: Request, res: Response): Promise<void> {
    try {
      const params = getPaginationParams(req);
      const result = await this._forumService.getForums(params.page, params.limit, params.searchTerm);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.GET_FORUMS_SUCCESS, result));

      } 
      catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.GET_FORUMS_ERROR, (error as Error).message));
    }
  }

  /**
   * This method gets a forum by forumId
   * @param req forumId
   * @param res 
   */
  async getForum(req: Request, res: Response): Promise<void> {
    try {
      const { forumId } = req.params;
      const forum = await this._forumService.getForum(forumId);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.GET_FORUM_SUCCESS, forum));
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.GET_FORUM_ERROR, (error as Error).message));
    }
  }

  /**
   * This update a forum by forumId
   * @param req forumId
   * @param req title, description, topics, userId
   * @param res 
   */
  async updateForum(req: Request, res: Response): Promise<void> {
    try {
      const { forumId } = req.params;
      const { title, description, topics, userId } = req.body;
      const forum = await this._forumService.updateForum(forumId, userId, title, description, topics);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.UPDATE_FORUM_SUCCESS, forum));
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.UPDATE_FORUM_ERROR, (error as Error).message));
    }
  }

  /**
   * This method deletes a forum by forumId
   * @param req forumId
   * @param req userId
   * @param res 
   */
  async deleteForum(req: Request, res: Response): Promise<void> {
    try {
      const { forumId } = req.params;
      const { userId } = req.body;
      await this._forumService.deleteForum(forumId, userId);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.DELETE_FORUM_SUCCESS, null));
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.DELETE_FORUM_ERROR, (error as Error).message));
    }
  }

  /**
   * This method creates a forum 
   * @param req forumId, title, description, topics, userId
   * @param res 
   */
  async createForum(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, topics, userId } = req.body;
      const forum = await this._forumService.createForum(userId, title, description, topics);
      res.status(HttpStatus.CREATED).json(successResponse(RESPONSE_MESSAGES.FORUM.CREATE_FORUM_SUCCESS, forum));
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.CREATE_FORUM_ERROR, (error as Error).message));
    }
  }

  /**
   * This method gets all posts in a forum with pagination and optional search query
   * @param req forumId, page, pageSize, query
   * @param res 
   */
  async getPosts(req: Request, res: Response): Promise<void> {
    try {
      const { forumId } = req.params;
      const params = getPaginationParams(req);
      const result = req.query.query as string
        ? await this._forumService.searchPosts(forumId, req.query.query as string, params.page, params.limit)
        : await this._forumService.getPosts(forumId, params.page, params.limit);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.GET_FORUMS_SUCCESS, result));

     
      
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        errorResponse(RESPONSE_MESSAGES.FORUM.GET_POSTS_ERROR, (error as Error).message)
      );
    }
  }

  /**
   * This method creates a post in a forum
   * @param req forumId, content, topic, userId, userName, files
   * @param res 
   */
  async createPost(req: Request, res: Response): Promise<void> {
    try {
      apiLogger.info(`Creating post for forum ${req.params.forumId} by user ${req.body.userId}`);
      
      const { forumId } = req.params;
      const { content, topic, userId, userName, files } = req.body;
      
      const fileArray = files && Array.isArray(files) ? files.map(file => {
        if (!file.url || !file.key) {
          throw new Error("Invalid file metadata: url and key are required");
        }
        return {
          url: file.publicUrl || file.url,
          key: file.key,
          type: file.type || "image/jpeg",
          size: file.size || 0,
          name: file.name || file.key.split("/").pop(),
          publicUrl: file.publicUrl
        };
      }) : [];

      const post = await this._forumService.createPost(forumId, userId, userName, content, topic, fileArray);
      res.status(HttpStatus.CREATED).json(successResponse(RESPONSE_MESSAGES.FORUM.CREATE_POST_SUCCESS, post));
    } catch (error) {
      apiLogger.error(`Error creating post: ${(error as Error).message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.CREATE_POST_ERROR, (error as Error).message));
    }
  }

  /**
   * This method gets a post by postId
   * @param req forumId, postId
   * @param res 
   */
  async getPost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const post = await this._forumService.getPost(postId);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.GET_POST_SUCCESS, post));
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.GET_POST_ERROR, (error as Error).message));
    }
  }

  /**
   * This method updates a post by postId
   * @param req forumId, postId, content, topic, userId, files
   * @param res 
   */
  async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { content, topic, userId, files } = req.body;

      const fileArray = files && Array.isArray(files) ? files.map(file => {
        if (!file.url || !file.key) {
          throw new Error("Invalid file metadata: url and key are required");
        }
        return {
          url: file.url,
          key: file.key,
          type: file.type || "image/jpeg",
          size: file.size || 0,
          name: file.name || file.key.split("/").pop(),
        };
      }) : [];

      const post = await this._forumService.updatePost(postId, userId, content, topic, fileArray);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.UPDATE_POST_SUCCESS, post));
    } catch (error) {
      apiLogger.error(`Error updating post: ${(error as Error).message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.UPDATE_POST_ERROR, (error as Error).message));
    }
  }

  /**
   * This method deletes a post by postId
   * @param req forumId, postId, userId
   * @param res 
   */
  async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      const { postId } = req.params;
      await this._forumService.deletePost(postId, userId);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.DELETE_POST_SUCCESS, null));
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.DELETE_POST_ERROR, (error as Error).message));
    }
  }

  /**
   * This method gets all replies to a post with pagination
   * @param req forumId, postId, page, pageSize
   * @param res 
   */
  async getReplies(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const params = getPaginationParams(req);
      const result = await this._forumService.getReplies(postId, params.page, params.limit);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.GET_REPLIES_SUCCESS, result));
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        errorResponse(RESPONSE_MESSAGES.FORUM.GET_REPLIES_ERROR, (error as Error).message)
      );
    }
  }

  /**
   * This method creates a reply to a post
   * @param req forumId, postId, content, userId, userName, files, parentReplyId
   * @param res 
   */
  async createReply(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { content, userId, userName, files, parentReplyId } = req.body;

      const fileArray = files && Array.isArray(files) ? files.map(file => {
        if (!file.url || !file.key) {
          throw new Error("Invalid file metadata: url and key are required");
        }
        return {
          url: file.url,
          key: file.key,
          type: file.type || "image/jpeg",
          size: file.size || 0,
          name: file.name || file.key.split("/").pop(),
        };
      }) : [];

      const reply = await this._forumService.createReply(postId, userId, userName, content, fileArray, parentReplyId);
      
      // Live update for others when someone creates a reply
      const io = req.app.get('io');
      io.to(`post:${postId}`).emit('newReply', reply);
      
      res.status(HttpStatus.CREATED).json(successResponse(RESPONSE_MESSAGES.FORUM.CREATE_REPLY_SUCCESS, reply));
    } catch (error) {
      apiLogger.error(`Error creating reply: ${(error as Error).message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.CREATE_REPLY_ERROR, (error as Error).message));
    }
  }

 
/**
 * This method updates reply in forum 
 * @param req forumId, postId, replyId, content, userId, files
 * @param res 
 */
  async updateReply(req: Request, res: Response): Promise<void> {
    try {
      const { replyId } = req.params;
      const { content, userId, files } = req.body;

      const fileArray = files && Array.isArray(files) ? files.map(file => {
        if (!file.url || !file.key) {
          throw new Error("Invalid file metadata: url and key are required");
        }
        return {
          url: file.url,
          key: file.key,
          type: file.type || "image/jpeg",
          size: file.size || 0,
          name: file.name || file.key.split("/").pop(),
        };
      }) : [];

      const reply = await this._forumService.updateReply(replyId, userId, content, fileArray);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.UPDATE_REPLY_SUCCESS, reply));
    } catch (error) {
      apiLogger.error(`Error updating reply: ${(error as Error).message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.UPDATE_REPLY_ERROR, (error as Error).message));
    }
  }

  /**
   * This method deletes a reply by replyId
   * @param req forumId, postId, replyId, userId
   * @param res 
   */
  async deleteReply(req: Request, res: Response): Promise<void> {
    try {
      const { replyId } = req.params;
      const { userId } = req.body;
      await this._forumService.deleteReply(replyId, userId);
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.FORUM.DELETE_REPLY_SUCCESS, null));
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.FORUM.DELETE_REPLY_ERROR, (error as Error).message));
    }
  }
}