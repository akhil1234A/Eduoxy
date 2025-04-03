import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { IChatService } from "./interfaces/chat.service";
import { ILiveClassService } from "./interfaces/liveClass.service";
import { IUserService } from "./interfaces/user.service";
import TYPES from "./di/types";
import container from "./di/container";
import { IForumService } from "./interfaces/forum.service";

const chatService = container.get<IChatService>(TYPES.IChatService);
const liveClassService = container.get<ILiveClassService>(TYPES.ILiveClassService);
const userService = container.get<IUserService>(TYPES.IUserService);
const forumService = container.get<IForumService>(TYPES.IForumService);

const DEFAULT_FORUM_ID = "general";

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
    transports: ["polling", "websocket"],
  });

  const liveChats: { [liveClassId: string]: { senderId: string; senderName: string; message: string; timestamp: string }[] } = {};

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      socket.emit("error", { message: "User ID is required" });
      socket.disconnect();
      return;
    }
    socket.join(userId);
    console.log(`User ${userId} joined their room`);

    socket.on("joinChat", ({ courseId }) => {
      if (!courseId) {
        socket.emit("error", { message: "Course ID is required to join chat" });
        return;
      }
      const chatRoom = `chat:${courseId}:${userId}`;
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
        const senderRoom = `chat:${courseId}:${userId}`;
        const receiverRoom = `chat:${courseId}:${receiverId}`;
        io.to(senderRoom).to(receiverRoom).emit("newMessage", savedMessage);
        console.log(`Message sent from ${userId} to ${receiverId} in course ${courseId}`);
      } catch (error) {
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("leaveChat", ({ courseId }) => {
      const chatRoom = `chat:${courseId}:${userId}`;
      socket.leave(chatRoom);
      console.log(`User ${userId} left chat room ${chatRoom}`);
    });

    socket.on("joinLiveClass", async ({ liveClassId }) => {
      if (!liveClassId) {
        socket.emit("error", { message: "Live class ID is required" });
        return;
      }
      try {
        const liveClass = await liveClassService.joinLiveClass(liveClassId, userId);
        const user = await userService.getProfile(userId);
        const liveRoom = `live:${liveClassId}`;
        socket.join(liveRoom);

        const participantsWithNames = await Promise.all(
          liveClass.participants.map(async (id) => ({
            userId: id,
            userName: (await userService.getProfile(id))?.name || id,
          }))
        );

        io.to(liveRoom).emit("userJoined", {
          userId,
          userName: user?.name || userId,
          participants: participantsWithNames,
        });
        console.log(`User ${userId} joined ${liveRoom}, participants:`, participantsWithNames);

        if (userId === liveClass.teacherId) {
          socket.to(liveRoom).emit("peerConnected", { peerId: userId });
          console.log(`Teacher ${userId} triggered peerConnected for room ${liveRoom}`);
        }

        socket.emit("chatHistory", liveChats[liveClassId] || []);
        console.log(`User ${userId} joined live class ${liveClassId}`);
      } catch (error) {
        console.error(`Error joining live class ${liveClassId}:`, error);
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("signal", ({ to, signal }) => {
      if (!to || !signal) {
        socket.emit("error", { message: "Missing 'to' or 'signal' in signal event" });
        return;
      }
      io.to(to).emit("signal", { from: userId, signal });
      console.log(`Signal from ${userId} to ${to}`);
    });

    socket.on("sendLiveMessage", async ({ liveClassId, message }) => {
      if (!liveClassId || !message) {
        socket.emit("error", { message: "Missing liveClassId or message" });
        return;
      }
      try {
        const user = await userService.getProfile(userId);
        const liveRoom = `live:${liveClassId}`;
        const chatMessage = {
          senderId: userId,
          senderName: user?.name || userId,
          message,
          timestamp: new Date().toISOString(),
        };

        if (!liveChats[liveClassId]) liveChats[liveClassId] = [];
        liveChats[liveClassId].push(chatMessage);

        io.to(liveRoom).emit("liveMessage", chatMessage);
        console.log(`Live message from ${userId} in ${liveClassId}: ${message}`);
      } catch (error) {
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("leaveLiveClass", async ({ liveClassId }) => {
      if (!liveClassId) {
        socket.emit("error", { message: "Live class ID is required" });
        return;
      }
      try {
        const liveClass = await liveClassService.leaveLiveClass(liveClassId, userId);
        const liveRoom = `live:${liveClassId}`;
        socket.leave(liveRoom);

        const participantsWithNames = await Promise.all(
          liveClass.participants.map(async (id) => ({
            userId: id,
            userName: (await userService.getProfile(id))?.name || id,
          }))
        );

        io.to(liveRoom).emit("userLeft", {
          userId,
          participants: participantsWithNames,
        });
        console.log(`User ${userId} left live class ${liveClassId}`);
      } catch (error) {
        socket.emit("error", { message: (error as Error).message });
      }
    });

    // Forum Events
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
        console.log(`Post ${postId} deleted by ${userId} in ${DEFAULT_FORUM_ID}`)
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

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function sendNotification(io: Server, userId: string, notification: any) {
  io.to(userId).emit("notification", notification);
  console.log(`Notification sent to user ${userId}:`, notification);
}

export function broadcastToCourseChat(io: Server, courseId: string, event: string, data: any) {
  io.to(`chat:${courseId}:*`).emit(event, data);
  console.log(`Broadcasted ${event} to course ${courseId}:`, data);
}