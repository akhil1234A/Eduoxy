import { injectable } from "inversify";
import mongoose from "mongoose";
import { Forum, Post, Reply } from "../models/forum.model";
import { IForum, IPost, IReply, IReplyTreeNode, IPaginated, IFile } from "../interfaces/forum.model";
import { s3Service } from "../services/s3.service";
import { BaseRepository } from "./base.repository";
import { IForumRepository } from "../interfaces/forum.repository";
import { apiLogger } from "../utils/logger";

@injectable()
export class ForumRepository extends BaseRepository<IForum> implements IForumRepository {
  constructor() {
    super(Forum);
  }

  async getForums(page: number, pageSize: number, query?: string): Promise<IPaginated<IForum>> {
    try {
      const skip = (page - 1) * pageSize;
      const filter = query ? { $text: { $search: query } } : {};
      const [items, total] = await Promise.all([
        Forum.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
        Forum.countDocuments(filter),
      ]);
      return { items: items.map(this.mapForum), total, page, pageSize };
    } catch (error) {
      throw new Error(`Failed to fetch forums: ${(error as Error).message}`);
    }
  }

  async createForum(forum: Omit<IForum, "_id" | "createdAt" | "updatedAt">): Promise<IForum> {
    try {
      const newForum = new Forum(forum);
      await newForum.save();
      return this.mapForum(newForum.toObject());
    } catch (error) {
      throw new Error(`Failed to create forum: ${(error as Error).message}`);
    }
  }

  async getPosts(forumId: string, page: number, pageSize: number): Promise<IPaginated<IPost>> {
    try {
      const skip = (page - 1) * pageSize;
      const [items, total] = await Promise.all([
        Post.find({ forumId }).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
        Post.countDocuments({ forumId }),
      ]);
      return { items: items.map(this.mapPost), total, page, pageSize };
    } catch (error) {
      throw new Error(`Failed to fetch posts: ${(error as Error).message}`);
    }
  }

  async getPostsByTopic(forumId: string, topic: string, page: number, pageSize: number): Promise<IPaginated<IPost>> {
    try {
      const skip = (page - 1) * pageSize;
      const [items, total] = await Promise.all([
        Post.find({ forumId, topic }).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
        Post.countDocuments({ forumId, topic }),
      ]);
      return { items: items.map(this.mapPost), total, page, pageSize };
    } catch (error) {
      throw new Error(`Failed to fetch posts by topic: ${(error as Error).message}`);
    }
  }

  async searchPosts(forumId: string, query: string, page: number, pageSize: number): Promise<IPaginated<IPost>> {
    try {
      const skip = (page - 1) * pageSize;
      const regex = new RegExp(query, "i");
      const filter = {
        forumId,
        $or: [
          { content: { $regex: regex } },
          { topic: { $regex: regex } },
        ],
      };
      const [items, total] = await Promise.all([
        Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
        Post.countDocuments(filter),
      ]);
      return { items: items.map(this.mapPost), total, page, pageSize };
    } catch (error) {
      throw new Error(`Failed to search posts: ${(error as Error).message}`);
    }
  }

  async getPost(postId: string): Promise<IPost> {
    try {
      const post = await Post.findById(postId).lean();
      if (!post) throw new Error("Post not found");
      return this.mapPost(post);
    } catch (error) {
      throw new Error(`Failed to fetch post: ${(error as Error).message}`);
    }
  }

  async createPost(post: Omit<IPost, "_id" | "createdAt" | "updatedAt">): Promise<IPost> {
    try {
      const forum = await Forum.findById(post.forumId).exec();
      if (!forum) throw new Error("Forum not found");

      if (post.files && !post.files.every((file: IFile) => file.url && file.type && file.key)) {
        throw new Error("Invalid file metadata: url, type, and key are required");
      }

      const newPost = new Post(post);
      await newPost.save();
      return this.mapPost(newPost.toObject());
    } catch (error) {
      throw new Error(`Failed to create post: ${(error as Error).message}`);
    }
  }

  async updatePost(postId: string, userId: string, content: string, topic: string, files: IFile[] = []): Promise<IPost> {
    try {
      const post = await Post.findById(postId).exec();
      if (!post) throw new Error("Post not found");
      if (post.userId !== userId) throw new Error("Unauthorized to edit post");

      for (const file of post.files) {
        if (file.key) {
          await s3Service.deleteObject(file.key);
        }
      }

      post.content = content;
      post.topic = topic;
      post.files = files;
      post.updatedAt = new Date();
      await post.save();
      return this.mapPost(post.toObject());
    } catch (error) {
      throw new Error(`Failed to update post: ${(error as Error).message}`);
    }
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    try {
      const post = await Post.findById(postId).exec();
      if (!post) throw new Error("Post not found");
      if (post.userId !== userId) throw new Error("Unauthorized to delete post");

      for (const file of post.files) {
        const key = file.key || s3Service.extractKeyFromUrl(file.url);
        if (key) await s3Service.deleteObject(key);
      }

      await Post.deleteOne({ _id: postId });
      await Reply.deleteMany({ postId });
    } catch (error) {
      throw new Error(`Failed to delete post: ${(error as Error).message}`);
    }
  }

  async getReplies(postId: string, page: number, pageSize: number, parentReplyId?: string): Promise<IPaginated<IReply>> {
    try {
      const skip = (page - 1) * pageSize;
      const filter = parentReplyId ? { postId, parentReplyId: new mongoose.Types.ObjectId(parentReplyId) } : { postId, parentReplyId: null };
      const [items, total] = await Promise.all([
        Reply.find(filter).sort({ createdAt: 1 }).skip(skip).limit(pageSize).lean(),
        Reply.countDocuments(filter),
      ]);
      return { items: items.map(this.mapReply), total, page, pageSize };
    } catch (error) {
      throw new Error(`Failed to fetch replies: ${(error as Error).message}`);
    }
  }

  async getReplyTree(postId: string, page: number, pageSize: number, maxDepth?: number): Promise<IPaginated<IReplyTreeNode>> {
    try {
      const skip = (page - 1) * pageSize;
      const pipeline: mongoose.PipelineStage[] = [
        {
          $match: { postId: new mongoose.Types.ObjectId(postId), parentReplyId: null },
        },
        {
          $sort: { createdAt: 1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: pageSize,
        },
        {
          $graphLookup: {
            from: "replies",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "parentReplyId",
            as: "children",
            maxDepth: maxDepth || 10,
            depthField: "depth",
          },
        },
        {
          $project: {
            _id: 1,
            postId: 1,
            parentReplyId: 1,
            userId: 1,
            userName: 1,
            content: 1,
            files: 1,
            createdAt: 1,
            updatedAt: 1,
            children: {
              $map: {
                input: "$children",
                as: "child",
                in: {
                  _id: "$$child._id",
                  postId: "$$child.postId",
                  parentReplyId: "$$child.parentReplyId",
                  userId: "$$child.userId",
                  userName: "$$child.userName",
                  content: "$$child.content",
                  files: "$$child.files",
                  createdAt: "$$child.createdAt",
                  updatedAt: "$$child.updatedAt",
                  depth: "$$child.depth",
                },
              },
            },
          },
        },
        {
          $sort: { "children.createdAt": 1 },
        },
      ];

      const [result, total] = await Promise.all([
        Reply.aggregate(pipeline).exec(),
        Reply.countDocuments({ postId, parentReplyId: null }),
      ]);

      const tree = this.buildReplyTree(result);
      return { items: tree.map(item => this.mapReplyTreeNode(item)), total, page, pageSize };
    } catch (error) {
      apiLogger.error(`Failed to fetch reply tree: ${(error as Error).message}`);
      throw new Error(`Failed to fetch reply tree: ${(error as Error).message}`);
    }
  }

  async createReply(reply: Omit<IReply, "_id" | "createdAt" | "updatedAt">): Promise<IReply> {
    try {
      const post = await Post.findById(reply.postId).exec();
      if (!post) throw new Error("Post not found");

      if (reply.parentReplyId) {
        const parentReply = await Reply.findById(reply.parentReplyId).exec();
        if (!parentReply) throw new Error("Parent reply not found");
        apiLogger.info(`Parent reply found: ${parentReply._id}`);
        apiLogger.info(`Parent reply postId: ${parentReply.postId}`);
        apiLogger.info(`Reply postId: ${reply.postId}`);
        if (parentReply.postId.toString() !== reply.postId.toString()) throw new Error("Parent reply does not belong to the post");
      }

      if (reply.files && !reply.files.every((file: IFile) => file.url && file.type && file.key)) {
        throw new Error("Invalid file metadata: url, type, and key are required");
      }

      const newReply = new Reply({
        ...reply,
        parentReplyId: reply.parentReplyId ? new mongoose.Types.ObjectId(reply.parentReplyId) : null,
      });
      await newReply.save();
      return this.mapReply(newReply.toObject());
    } catch (error) {
      apiLogger.error(`Failed to create reply: ${(error as Error).message}`);
      throw new Error(`Failed to create reply: ${(error as Error).message}`);
    }
  }

  async updateReply(replyId: string, userId: string, content: string, files: IFile[] = []): Promise<IReply> {
    try {
      const reply = await Reply.findById(replyId).exec();
      if (!reply) throw new Error("Reply not found");
      if (reply.userId !== userId) throw new Error("Unauthorized to edit reply");

      for (const file of reply.files) {
        if (file.key) {
          await s3Service.deleteObject(file.key);
        }
      }

      reply.content = content;
      reply.files = files;
      reply.updatedAt = new Date();
      await reply.save();
      return this.mapReply(reply.toObject());
    } catch (error) {
      throw new Error(`Failed to update reply: ${(error as Error).message}`);
    }
  }

  async deleteReply(replyId: string, userId: string): Promise<void> {
    try {
      const reply = await Reply.findById(replyId).exec();
      if (!reply) throw new Error("Reply not found");
      if (reply.userId !== userId) throw new Error("Unauthorized to delete reply");

      for (const file of reply.files) {
        const key = file.key || s3Service.extractKeyFromUrl(file.url);
        if (key) await s3Service.deleteObject(key);
      }

      await Reply.deleteOne({ _id: replyId });
      await Reply.deleteMany({ parentReplyId: replyId });
    } catch (error) {
      throw new Error(`Failed to delete reply: ${(error as Error).message}`);
    }
  }

  async getForum(forumId: string): Promise<IForum> {
    const forum = await Forum.findById(forumId);
    if (!forum) throw new Error("Forum not found");
    return forum;
  }

  async updateForum(forumId: string, data: Partial<IForum>): Promise<IForum> {
    const forum = await Forum.findByIdAndUpdate(
      forumId,
      { ...data, updatedAt: new Date() },
      { new: true }
    );
    if (!forum) throw new Error("Forum not found");
    return forum;
  }

  async deleteForum(forumId: string): Promise<void> {
    const result = await Forum.findByIdAndDelete(forumId);
    if (!result) throw new Error("Forum not found");
  }

  async getReply(replyId: string): Promise<IReply> {
    const reply = await Reply.findById(replyId);
    if (!reply) throw new Error("Reply not found");
    return reply;
  }

  private mapForum(forum: any): IForum {
    return {
      _id: forum._id.toString(),
      title: forum.title,
      description: forum.description,
      topics: forum.topics || [],
      createdAt: forum.createdAt,
      updatedAt: forum.updatedAt,
    };
  }

  private mapPost(post: any): IPost {
    return {
      _id: post._id.toString(),
      forumId: post.forumId.toString(),
      userId: post.userId,
      userName: post.userName,
      content: post.content,
      topic: post.topic,
      files: (post.files || []).map((file: any) => ({
        url: file.publicUrl || file.url,
        key: file.key,
        type: file.type,
        size: file.size,
        name: file.name,
        publicUrl: file.publicUrl
      })),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  private mapReply(reply: any): IReply {
    return {
      _id: reply._id.toString(),
      postId: reply.postId.toString(),
      parentReplyId: reply.parentReplyId ? reply.parentReplyId.toString() : null,
      userId: reply.userId,
      userName: reply.userName,
      content: reply.content,
      files: (reply.files || []).map((file: any) => ({
        url: file.publicUrl || file.url,
        key: file.key,
        type: file.type,
        size: file.size,
        name: file.name,
        publicUrl: file.publicUrl
      })),
      createdAt: reply.createdAt,
      updatedAt: reply.updatedAt,
    };
  }

  private mapReplyTreeNode(reply: any): IReplyTreeNode {
    if (!reply) {
      throw new Error("Invalid reply data");
    }
    return {
      ...this.mapReply(reply),
      depth: reply.depth || 0,
      children: Array.isArray(reply.children) 
        ? reply.children.map((child: any) => this.mapReplyTreeNode(child))
        : [],
    };
  }

  private buildReplyTree(replies: any[]): any[] {
    const replyMap = new Map<string, any>();
    const tree: any[] = [];

    // Initialize all replies with empty children arrays
    replies.forEach(reply => {
      replyMap.set(reply._id.toString(), {
        ...reply,
        children: reply.children || [],
        depth: reply.depth || 0
      });
    });

    // Build tree by linking children to parents
    replyMap.forEach(reply => {
      if (reply.parentReplyId) {
        const parent = replyMap.get(reply.parentReplyId.toString());
        if (parent) {
          parent.children.push(reply);
        }
      } else {
        tree.push(reply);
      }
    });

    // Sort children by createdAt
    replyMap.forEach(reply => {
      if (reply.children.length > 0) {
        reply.children.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
    });

    return tree;
  }
}