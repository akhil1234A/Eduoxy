import { IForumRepository, IPost, IReply } from "../interfaces/forum.repository";
import { Forum } from "../models/forum.model";
import { Types } from "mongoose";

export class ForumRepository implements IForumRepository {
  async getPosts(forumId: string): Promise<IPost[]> {
    try {
      const forum = await Forum.findOne({ forumId }).exec();
      console.log(`Fetched posts for forum ${forumId}:`, forum?.posts.length || 0);
      return forum ? forum.posts.map(post => ({
        _id: post._id.toString(),
        userId: post.userId,
        userName: post.userName,
        content: post.content,
        topic: post.topic,
        timestamp: post.timestamp,
        replies: post.replies.map(reply => ({
          _id: reply._id.toString(),
          userId: reply.userId,
          userName: reply.userName,
          content: reply.content,
          timestamp: reply.timestamp
        }))
      })) : [];
    } catch (error) {
      console.error(`Error fetching posts for forum ${forumId}:`, error);
      throw error;
    }
  }

  async createPost(forumId: string, post: Omit<IPost, "_id">): Promise<IPost> {
    try {
      let forum = await Forum.findOne({ forumId }).exec();
      if (!forum) {
        forum = new Forum({ forumId, posts: [] });
        console.log(`Created new forum with ID ${forumId}`);
      }
      const newPost = {
        userId: post.userId,
        userName: post.userName,
        content: post.content,
        topic: post.topic,
        timestamp: post.timestamp,
        replies: [],
      };
      forum.posts.push(newPost);
      await forum.save();
      const savedPost = forum.posts[forum.posts.length - 1];
      console.log(`Created post in forum ${forumId}:`, savedPost);
      
      // Convert Mongoose document to plain object with string IDs
      const postObj = savedPost.toObject();
      return {
        _id: postObj._id.toString(),
        userId: postObj.userId,
        userName: postObj.userName,
        content: postObj.content,
        topic: postObj.topic,
        timestamp: postObj.timestamp,
        replies: postObj.replies.map(reply => ({
          _id: reply._id.toString(),
          userId: reply.userId,
          userName: reply.userName,
          content: reply.content,
          timestamp: reply.timestamp
        }))
      };
    } catch (error) {
      console.error(`Error creating post in forum ${forumId}:`, error);
      throw error;
    }
  }

  async createReply(forumId: string, postId: string, reply: Omit<IReply, "_id">): Promise<IReply> {
    try {
      const forum = await Forum.findOne({ forumId }).exec();
      if (!forum) throw new Error(`Forum ${forumId} not found`);
      const post = forum.posts.id(postId);
      if (!post) throw new Error(`Post ${postId} not found in forum ${forumId}`);
      const newReply = {
        userId: reply.userId,
        userName: reply.userName,
        content: reply.content,
        timestamp: reply.timestamp,
      };
      post.replies.push(newReply);
      await forum.save();
      const savedReply = post.replies[post.replies.length - 1];
      console.log(`Created reply for post ${postId} in forum ${forumId}:`, savedReply);
      
      // Convert Mongoose document to plain object with string ID
      const replyObj = savedReply.toObject();
      return {
        _id: replyObj._id.toString(),
        userId: replyObj.userId,
        userName: replyObj.userName,
        content: replyObj.content,
        timestamp: replyObj.timestamp
      };
    } catch (error) {
      console.error(`Error creating reply in forum ${forumId}:`, error);
      throw error;
    }
  }

  async deletePost(forumId: string, postId: string, userId: string): Promise<void> {
    try {
      const forum = await Forum.findOne({ forumId }).exec();
      if (!forum) throw new Error(`Forum ${forumId} not found`);
      const post = forum.posts.id(postId);
      if (!post) throw new Error(`Post ${postId} not found in forum ${forumId}`);
      if (post.userId !== userId) throw new Error("You can only delete your own posts");
      
      // Use pull instead of remove for subdocuments
      forum.posts.pull({ _id: postId });
      await forum.save();
      console.log(`Deleted post ${postId} from forum ${forumId}`);
    } catch (error) {
      console.error(`Error deleting post ${postId} in forum ${forumId}:`, error);
      throw error;
    }
  }

  async getPostsByTopic(forumId: string, topic: string): Promise<IPost[]> {
    try {
      const forum = await Forum.findOne({ forumId }).exec();
      if (!forum) return [];
      const filteredPosts = forum.posts
        .filter((post) => post.topic === topic)
        .map(post => {
          const postObj = post.toObject();
          return {
            _id: postObj._id.toString(),
            userId: postObj.userId,
            userName: postObj.userName,
            content: postObj.content,
            topic: postObj.topic,
            timestamp: postObj.timestamp,
            replies: postObj.replies.map(reply => ({
              _id: reply._id.toString(),
              userId: reply.userId,
              userName: reply.userName,
              content: reply.content,
              timestamp: reply.timestamp
            }))
          };
        });
      console.log(`Filtered ${filteredPosts.length} posts by topic ${topic} in forum ${forumId}`);
      return filteredPosts;
    } catch (error) {
      console.error(`Error filtering posts by topic in forum ${forumId}:`, error);
      throw error;
    }
  }

  async searchPosts(forumId: string, query: string): Promise<IPost[]> {
    try {
      const forum = await Forum.findOne({ forumId }).exec();
      if (!forum) return [];
      const filteredPosts = forum.posts
        .filter((post) => post.content.toLowerCase().includes(query.toLowerCase()))
        .map(post => {
          const postObj = post.toObject();
          return {
            _id: postObj._id.toString(),
            userId: postObj.userId,
            userName: postObj.userName,
            content: postObj.content,
            topic: postObj.topic,
            timestamp: postObj.timestamp,
            replies: postObj.replies.map(reply => ({
              _id: reply._id.toString(),
              userId: reply.userId,
              userName: reply.userName,
              content: reply.content,
              timestamp: reply.timestamp
            }))
          };
        });
      console.log(`Searched ${filteredPosts.length} posts with query ${query} in forum ${forumId}`);
      return filteredPosts;
    } catch (error) {
      console.error(`Error searching posts in forum ${forumId}:`, error);
      throw error;
    }
  }
}