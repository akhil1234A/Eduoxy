import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import type { IChatService } from "./interfaces/chat.service";
import type { ILiveClassService } from "./interfaces/liveClass.service";
import type { IUserService } from "./interfaces/user.service";
import TYPES from "./di/types";
import container from "./di/container";
import type { IForumService } from "./interfaces/forum.service";
import { socketLogger } from "./utils/socketLogger";
import redisClient from "./config/redis";

const chatService = container.get<IChatService>(TYPES.IChatService);
const liveClassService = container.get<ILiveClassService>(TYPES.ILiveClassService);
const userService = container.get<IUserService>(TYPES.IUserService);
const forumService = container.get<IForumService>(TYPES.IForumService);

const DEFAULT_FORUM_ID = "general";
const LIVE_CLASS_PREFIX = "live:class:";
const PARTICIPANTS_KEY = (liveClassId: string) => `${LIVE_CLASS_PREFIX}${liveClassId}:participants`;
const TEACHER_KEY = (liveClassId: string) => `${LIVE_CLASS_PREFIX}${liveClassId}:teacher`;
const CHAT_HISTORY_KEY = (liveClassId: string) => `${LIVE_CLASS_PREFIX}${liveClassId}:chat`;
const TEACHER_PEER_ID_KEY = (liveClassId: string) => `peer:${liveClassId}:teacher`;

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 30000,
    maxHttpBufferSize: 1e8,
    allowEIO3: true,
    allowUpgrades: true,
    upgradeTimeout: 10000,
  });

  io.engine.on("connection_error", (err) => {
    console.error("Socket.IO connection error:", err);
    socketLogger.error("Socket.IO connection error", { error: err });
  });

  io.engine.on("connection", () => {
    console.log("WebSocket connection established");
    socketLogger.info("WebSocket connection established");
  });

  io.engine.on("upgrade", () => {
    console.log("Socket.IO upgrade successful");
    socketLogger.info("Socket.IO upgrade successful");
  });

  io.engine.on("upgradeError", (err) => {
    console.error("Socket.IO upgrade error:", err);
    socketLogger.error("Socket.IO upgrade error", { error: err });
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socketLogger.info("Client connected", { socketId: socket.id });
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      socket.emit("error", { message: "User ID is required" });
      socket.disconnect();
      return;
    }
    socket.join(userId);
    console.log(`User ${userId} joined their room`);

    socket.on("joinNotifications", ({ userId }) => {
      if (!userId) {
        socket.emit("error", { message: "User ID is required to join notifications" });
        return;
      }
      socket.join(`notifications:${userId}`);
      console.log(`User ${userId} joined notifications room`);
    });

    socket.on("joinChat", ({ courseId }) => {
      if (!courseId) {
        socket.emit("error", { message: "Course ID is required to join chat" });
        return;
      }
      const chatRoom = `chat:${courseId}`;
      socket.join(chatRoom);
      console.log(`User ${userId} joined chat room ${chatRoom}`);
      io.to(chatRoom).emit("userJoined", { userId, courseId });
    });

    socket.on("sendMessage", async ({ courseId, receiverId, message, isFile = false, fileName }) => {
      if (!courseId || !receiverId || !message) {
        socket.emit("error", { message: "Missing required fields: courseId, receiverId, or message" });
        return;
      }
      try {
        const savedMessage = await chatService.sendMessage(courseId, userId, receiverId, message, isFile, fileName);
        const chatRoom = `chat:${courseId}`;
        io.to(chatRoom).emit("newMessage", savedMessage);
        console.log(`Message sent from ${userId} to ${receiverId} in course ${courseId}`);
      } catch (error) {
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("leaveChat", ({ courseId }) => {
      const chatRoom = `chat:${courseId}`;
      socket.leave(chatRoom);
      console.log(`User ${userId} left chat room ${chatRoom}`);
    });

    socket.on("joinForum", async () => {
      const forumRoom = `forum:${DEFAULT_FORUM_ID}`;
      socket.join(forumRoom);
      try {
        const posts = await forumService.getPosts(DEFAULT_FORUM_ID);
        socket.emit("forumPosts", posts);
        console.log(`User ${userId} joined forum ${DEFAULT_FORUM_ID}, sent ${posts.length} posts`);
      } catch (error) {
        console.error(`Error joining forum ${DEFAULT_FORUM_ID}:`, error);
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("createPost", async ({ content, topic }) => {
      try {
        const post = await forumService.createPost(DEFAULT_FORUM_ID, userId, content, topic);
        io.to(`forum:${DEFAULT_FORUM_ID}`).emit("newPost", post);
        console.log(`Post created by ${userId} in ${DEFAULT_FORUM_ID}: ${content}`);
      } catch (error) {
        console.error(`Error creating post in ${DEFAULT_FORUM_ID}:`, error);
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("createReply", async ({ postId, content }) => {
      try {
        const reply = await forumService.createReply(DEFAULT_FORUM_ID, postId, userId, content);
        io.to(`forum:${DEFAULT_FORUM_ID}`).emit("newReply", { postId, reply });
        console.log(`Reply by ${userId} to post ${postId} in ${DEFAULT_FORUM_ID}`);
      } catch (error) {
        console.error(`Error creating reply in ${DEFAULT_FORUM_ID}:`, error);
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("deletePost", async ({ postId }) => {
      try {
        await forumService.deletePost(DEFAULT_FORUM_ID, postId, userId);
        io.to(`forum:${DEFAULT_FORUM_ID}`).emit("postDeleted", postId);
        console.log(`Post ${postId} deleted by ${userId} in ${DEFAULT_FORUM_ID}`);
      } catch (error) {
        console.error(`Error deleting post ${postId} in ${DEFAULT_FORUM_ID}:`, error);
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("filterByTopic", async ({ topic }) => {
      try {
        const posts = await forumService.getPostsByTopic(DEFAULT_FORUM_ID, topic);
        socket.emit("forumPosts", posts);
        console.log(`Filtered posts by topic ${topic} for ${userId} in ${DEFAULT_FORUM_ID}`);
      } catch (error) {
        console.error(`Error filtering posts by topic in ${DEFAULT_FORUM_ID}:`, error);
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("searchPosts", async ({ query }) => {
      try {
        const posts = await forumService.searchPosts(DEFAULT_FORUM_ID, query);
        socket.emit("forumPosts", posts);
        console.log(`Searched posts with query ${query} for ${userId} in ${DEFAULT_FORUM_ID}`);
      } catch (error) {
        console.error(`Error searching posts in ${DEFAULT_FORUM_ID}:`, error);
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("joinLiveClass", async ({ liveClassId, isTeacher }) => {
      try {
        const liveRoom = `live:${liveClassId}`;
        const user = await userService.getProfile(userId);
    
        await liveClassService.joinLiveClass(liveClassId, userId);
        if (isTeacher) {
          await redisClient.set(TEACHER_KEY(liveClassId), userId, { EX: 3600 });
        }
    
        await redisClient.sAdd(PARTICIPANTS_KEY(liveClassId), userId);
        socket.join(liveRoom);
    
        const participants = await redisClient.sMembers(PARTICIPANTS_KEY(liveClassId));
        const participantsWithNames = await Promise.all(
          participants.map(async (id) => ({
            userId: id,
            userName: (await userService.getProfile(id))?.name || id,
          }))
        );
    
        io.to(liveRoom).emit("userJoined", {
          userId,
          userName: user?.name,
          participants: participantsWithNames,
          isTeacher,
        });
    
        const chatHistory = await redisClient.get(CHAT_HISTORY_KEY(liveClassId));
        socket.emit("chatHistory", chatHistory ? JSON.parse(chatHistory) : []);
      } catch (err) {
        socket.emit("error", { message: (err as Error).message });
      }
    });
    
    socket.on("sendLiveMessage", async ({ liveClassId, message }) => {
      try {
        const user = await userService.getProfile(userId);
        const chatMessage = {
          senderId: userId,
          senderName: user?.name || userId,
          message,
          timestamp: new Date().toISOString(),
        };
    
        let chatHistory = await redisClient.get(CHAT_HISTORY_KEY(liveClassId));
        const messages = chatHistory ? JSON.parse(chatHistory) : [];
        messages.push(chatMessage);
    
        await redisClient.set(CHAT_HISTORY_KEY(liveClassId), JSON.stringify(messages), { EX: 3600 });
        io.to(`live:${liveClassId}`).emit("liveMessage", chatMessage);
      } catch (err) {
        socket.emit("error", { message: (err as Error).message });
      }
    });
    
    socket.on("providePeerId", ({ liveClassId, peerId }) => {
      redisClient.set(TEACHER_PEER_ID_KEY(liveClassId), peerId, { EX: 3600 });
    });
    
    socket.on("requestStream", async ({ liveClassId, userId: studentId }) => {
      const teacherPeerId = await redisClient.get(TEACHER_PEER_ID_KEY(liveClassId));
      if (teacherPeerId) {
        io.to(studentId).emit("teacherPeerId", { peerId: teacherPeerId });
      } else {
        io.to(studentId).emit("error", { message: "Teacher not streaming yet" });
      }
    });
    

    socket.on("disconnect", async () => {
      console.log("[Socket] Client disconnected:", socket.id);
      socketLogger.info("Client disconnected", { socketId: socket.id });

      try {
        const liveClassKeys = await redisClient.keys(`${LIVE_CLASS_PREFIX}*:participants`);
        
        for (const participantsKey of liveClassKeys) {
          const liveClassId = participantsKey.split(':')[2];
          
          const isMember = await redisClient.sIsMember(participantsKey, userId);
          
          if (isMember) {
            await redisClient.sRem(participantsKey, userId);
            
            const teacherId = await redisClient.get(TEACHER_KEY(liveClassId));
            const isTeacher = teacherId === userId;
            
            if (isTeacher) {
              await redisClient.del(TEACHER_KEY(liveClassId));
              await redisClient.del(TEACHER_PEER_ID_KEY(liveClassId));
            }
            
            const participants = await redisClient.sMembers(participantsKey);
            const participantsWithNames = await Promise.all(
              participants.map(async (id) => ({
                userId: id,
                userName: (await userService.getProfile(id))?.name || id,
              }))
            );
            
            io.to(`live:${liveClassId}`).emit("userLeft", {
              userId,
              isTeacher,
              participants: participantsWithNames
            });
            
            await liveClassService.leaveLiveClass(liveClassId, userId);
            
            socket.leave(`live:${liveClassId}`);
            
            console.log(`User ${userId} left live class ${liveClassId}`);
            socketLogger.info("User left live class", { userId, liveClassId, isTeacher });
          }
        }
      } catch (error) {
        console.error("Error cleaning up live class on disconnect:", error);
        socketLogger.error("Error cleaning up live class on disconnect", { 
          error: (error as Error).message,
          userId,
          socketId: socket.id 
        });
      }
    });
  });

  return io;
}

export function sendNotification(io: Server, userId: string, notification: any) {
  io.to(userId).emit("notification", notification);
  console.log(`Notification sent to user ${userId}:`, notification);
}

export function broadcastToCourseChat(io: Server, courseId: string, event: string, data: any) {
  io.to(`chat:${courseId}`).emit(event, data);
  console.log(`Broadcasted ${event} to course ${courseId}:`, data);
}