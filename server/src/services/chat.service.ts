// src/services/chat.service.ts
import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IChatService } from "../interfaces/chat.service";
import { IMessage, IMessageInput } from "../models/chat.model";
import { ITransactionRepository } from "../interfaces/transaction.repository";
import { ICourseRepository } from "../interfaces/course.repository";
import { IRedisClient } from "../config/redis";
import { IChatRepository } from "../interfaces/chat.repository";

@injectable()
export class ChatService implements IChatService {
  constructor(
    @inject(TYPES.ITransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository,
    @inject(TYPES.IRedisClient) private _redisClient: IRedisClient,
    @inject(TYPES.IChatRepository) private _chatRepository: IChatRepository
  ) {}

  async getChatHistory(courseId: string, userId: string, instructorId: string): Promise<IMessage[]> {
    const transactions = await this._transactionRepository.findByUserId(userId);
    const isStudent = transactions.some((txn) => txn.courseId === courseId);

    const course = await this._courseRepository.findByCourseId(courseId);
    if (!course) {
      throw new Error("Course not found.");
    }

    const isInstructor = course.teacherId === userId;

    if (!isStudent && !isInstructor) {
      throw new Error("You must purchase the course or be the instructor to access this chat.");
    }

    if (isInstructor && instructorId !== userId) {
      throw new Error("Invalid instructor for this course.");
    }

    const cacheKey = `chat:${courseId}:${userId}:${instructorId}`;
    const cachedMessages = await this._redisClient.get(cacheKey);
    if (cachedMessages) {
      return JSON.parse(cachedMessages);
    }

    let messages: IMessage[];
    if (isInstructor) {
      // Instructors only see messages sent to them
      messages = await this._chatRepository.findMessagesByCourseAndUsers(courseId, instructorId, userId);
    } else {
      // Students see full conversation with instructor
      messages = await this._chatRepository.findMessagesByCourseAndUsers(courseId, userId, instructorId);
    }

    await this._redisClient.set(cacheKey, JSON.stringify(messages), { EX: 3600 });
    return messages;
  }

  async sendMessage(courseId: string, senderId: string, receiverId: string, message: string): Promise<IMessage> {

    console.log(courseId, senderId, receiverId, message);

    const course = await this._courseRepository.findByCourseId(courseId);
    console.log(course);
    if (!course) {
      throw new Error("Course not found.");
    }

    const transactions = await this._transactionRepository.findByUserId(senderId);
    const isStudent = transactions.some((txn) => txn.courseId === courseId);
    const isInstructor = course.teacherId === senderId;

    if (!isStudent && !isInstructor) {
      throw new Error("You must purchase the course or be the instructor to send messages.");
    }

    if (isStudent && receiverId !== course.teacherId) {
      throw new Error("Students can only message the instructor.");
    }

    const chatMessage: IMessageInput = {
      courseId,
      senderId,
      receiverId,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    const savedMessage = await this._chatRepository.createMessage(chatMessage as IMessage);

    const cacheKey = `chat:${courseId}:${senderId}:${receiverId}`;
    await this._redisClient.del(cacheKey);
    const reverseCacheKey = `chat:${courseId}:${receiverId}:${senderId}`;
    await this._redisClient.del(reverseCacheKey);

    return savedMessage;
  }
}