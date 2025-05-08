import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import type { IChatService } from "./interfaces/chat.service";
import type { ILiveClassService } from "./interfaces/liveClass.service";
import type { IUserService } from "./interfaces/user.service";
import TYPES from "./di/types";
import container from "./di/container";
import type { IForumService } from "./interfaces/forum.service";
import redisClient from "./config/redis";
import { INotification } from "./models/notification.model";

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


const roomParticipants: { [key: string]: { [key: string]: string } } = {};

//Send offers to everyone except the teacher
const roomTeachers: { [key: string]: string } = {};

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

  const roomUsers: { [key: string]: Set<string> } = {};

  io.engine.on("connection_error", (err) => {
    console.error("Socket.IO connection error:", err);
  });

  io.engine.on("connection", () => {
    console.log("WebSocket connection established");
  });

  io.engine.on("upgrade", () => {
    console.log("Socket.IO upgrade successful");
  });

  io.engine.on("upgradeError", (err) => {
    console.error("Socket.IO upgrade error:", err);
  });

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

    //Notifications Events
    socket.on("joinNotifications", ({ userId }) => {
      if (!userId) {
        socket.emit("error", { message: "User ID is required to join notifications" });
        return;
      }
      socket.join(`notifications:${userId}`);
      console.log(`User ${userId} joined notifications room`);
    });


    //Chat Events
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

    

    //Live Stream Events

    socket.on("joinRoom", async ({ roomId, isTeacher = false }) => {
      if (!roomId) {
        socket.emit("error", { message: "Room ID is required to join a room" });
        return;
      }
      socket.join(roomId);
      
      if (!roomUsers[roomId]) {
        roomUsers[roomId] = new Set();
      }
      roomUsers[roomId].add(userId);
      
      console.log(`User ${userId} joined room ${roomId} for WebRTC signaling`);
      console.log(`Room ${roomId} now has ${roomUsers[roomId].size} users`);
      
      io.to(roomId).emit("user-joined", { 
        userId, 
        userCount: roomUsers[roomId].size 
      });

      if (isTeacher) {
        roomTeachers[roomId] = userId;
        console.log(`Teacher ${userId} registered for room ${roomId}`);
      }

      try {
        const user = await userService.getProfile(userId);
        if (!roomParticipants[roomId]) {
          roomParticipants[roomId] = {};
        }
        roomParticipants[roomId][userId] = user.name || userId;
        
        io.to(roomId).emit("participant-joined", { 
          userId, 
          userName: user.name || userId 
        });
      } catch (error) {
        console.error(`Error getting user profile for ${userId}:`, error);
        if (!roomParticipants[roomId]) {
          roomParticipants[roomId] = {};
        }
        roomParticipants[roomId][userId] = userId;
        
        io.to(roomId).emit("participant-joined", { 
          userId, 
          userName: userId 
        });
      }
    });

    socket.on("student-ready", ({ roomId }) => {
      console.log(`Student ${userId} is ready in room ${roomId}`);
      // Forward to teacher only (everyone except sender)
      socket.to(roomId).emit("student-ready");
    });

    socket.on("request-offer", ({ roomId }) => {
      console.log(`User ${userId} requested an offer in room ${roomId}`);
      socket.to(roomId).emit("request-offer");
    });

    socket.on("offer", ({ offer, roomId }) => {
      console.log(`Received offer from ${userId} in room ${roomId}`);
      socket.to(roomId).emit("offer", { offer });
    });

    socket.on("answer", ({ answer, roomId }) => {
      console.log(`Received answer from ${userId} in room ${roomId}`);
      socket.to(roomId).emit("answer", { answer });
    });

    socket.on("ice-candidate", ({ candidate, roomId }) => {
      console.log(`Received ICE candidate from ${userId} in room ${roomId}`);
      socket.to(roomId).emit("ice-candidate", { candidate });
    });

    socket.on("live-class-message", ({ roomId, message }) => {
      console.log(`Received message from ${userId} in room ${roomId}: ${message.content}`);
      io.to(roomId).emit("live-class-message", message);
    });

    socket.on("get-participants", ({ roomId }) => {
      console.log(`User ${userId} requested participants list for room ${roomId}`);
      if (roomParticipants[roomId]) {
        socket.emit("participant-list", roomParticipants[roomId]);
      } else {
        socket.emit("participant-list", {});
      }
    });

    socket.on("end-stream", async ({ roomId }) => {
      console.log(`Teacher ${userId} is ending stream for room ${roomId}`);
      
      if (roomTeachers[roomId] !== userId) {
        socket.emit("error", { message: "Only the teacher can end the stream" });
        return;
      }
      
      try {
        io.to(roomId).emit("stream-ended", { roomId });
        
        const deleted = await liveClassService.deleteLiveClass(roomId);
        if (!deleted) {
          throw new Error("Failed to delete live class from database");
        }
        console.log(`Live class ${roomId} deleted from database`);
        
        delete roomUsers[roomId];
        delete roomParticipants[roomId];
        delete roomTeachers[roomId];
        
        console.log(`Room ${roomId} cleaned up after stream ended`);
      } catch (error) {
        console.error(`Error ending stream for room ${roomId}:`, error);
        socket.emit("error", { message: (error as Error).message });
      }
    });

    socket.on("leave-class", ({ roomId }) => {
      console.log(`User ${userId} is leaving class ${roomId}`);
      
      socket.leave(roomId);
      
      if (roomUsers[roomId] && roomUsers[roomId].has(userId)) {
        roomUsers[roomId].delete(userId);
        console.log(`User ${userId} removed from room ${roomId}`);
        console.log(`Room ${roomId} now has ${roomUsers[roomId].size} users`);
        
        
        io.to(roomId).emit("user-left", { 
          userId, 
          userCount: roomUsers[roomId].size 
        });
      }
      
      
      if (roomParticipants[roomId] && roomParticipants[roomId][userId]) {
        delete roomParticipants[roomId][userId];
        console.log(`User ${userId} removed from participants list in room ${roomId}`);
        
        
        io.to(roomId).emit("participant-left", { userId });
      }
    });
  
    socket.on("disconnect", async () => {
      console.log(`User ${userId} disconnected`);
    
      
      Object.keys(roomUsers).forEach(roomId => {
        if (roomUsers[roomId].has(userId)) {
          roomUsers[roomId].delete(userId);
          console.log(`User ${userId} removed from room ${roomId}`);
          console.log(`Room ${roomId} now has ${roomUsers[roomId].size} users`);
          
          // Notify others in the room
          io.to(roomId).emit("user-left", { 
            userId, 
            userCount: roomUsers[roomId].size 
          });
          
          // Clean up empty rooms
          if (roomUsers[roomId].size === 0) {
            delete roomUsers[roomId];
            console.log(`Room ${roomId} was deleted because it's empty`);
          }
        }
      });

     
      Object.keys(roomParticipants).forEach(roomId => {
        if (roomParticipants[roomId] && roomParticipants[roomId][userId]) {
          delete roomParticipants[roomId][userId];
          console.log(`User ${userId} removed from participants list in room ${roomId}`);
          
          
          io.to(roomId).emit("participant-left", { userId });
          
          
          if (Object.keys(roomParticipants[roomId]).length === 0) {
            delete roomParticipants[roomId];
            console.log(`Participants list for room ${roomId} was deleted because it's empty`);
          }
        }
      });
    });

    // Forum Events
    socket.on("joinForum", ({ forumId }) => {
      if (!forumId) {
        socket.emit("error", { message: "Forum ID is required" });
        return;
      }
      socket.join(`forum:${forumId}`);
      console.log(`User ${userId} joined forum ${forumId}`);
    });

    socket.on("joinPost", ({ postId }) => {
      if (!postId) {
        socket.emit("error", { message: "Post ID is required" });
        return;
      }
      socket.join(`post:${postId}`);
      console.log(`User ${userId} joined post ${postId}`);
    });
  });
  return io;
}

export function sendNotification(io: Server, userId: string, notification: INotification) {
  io.to(userId).emit("notification", notification);
  console.log(`Notification sent to user ${userId}:`, notification);
}

export function broadcastToCourseChat(io: Server, courseId: string, event: string, data: INotification) {
  io.to(`chat:${courseId}`).emit(event, data);
  console.log(`Broadcasted ${event} to course ${courseId}:`, data);
}