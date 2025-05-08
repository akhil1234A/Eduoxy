import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { IChatService } from "../interfaces/chat.service";
import { IMessage, IMessageInput } from "../models/chat.model";
import { ITransactionRepository } from "../interfaces/transaction.repository";
import { ICourseRepository } from "../interfaces/course.repository";
import { IRedisClient } from "../config/redis";
import { IChatRepository } from "../interfaces/chat.repository";

/**
 * This is a service responsible for managing chat functionalities
 * It handles sending and retrieving messages between students and instructors
 */
@injectable()
export class ChatService implements IChatService {
  constructor(
    @inject(TYPES.ITransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository,
    @inject(TYPES.IRedisClient) private _redisClient: IRedisClient,
    @inject(TYPES.IChatRepository) private _chatRepository: IChatRepository
  ) {}

  /**
   * This method retrieves chat history between two users for a specific course
   * @param courseId 
   * @param senderId 
   * @param receiverId 
   * @returns 
   */
  async getChatHistory(courseId: string, senderId: string, receiverId: string): Promise<IMessage[]> {
    const course = await this._courseRepository.findByCourseId(courseId);
    if (!course) {
      throw new Error("Course not found.");
    }
  
    const isInstructor = course.teacherId === senderId || course.teacherId === receiverId;
  
    let isStudent = false;
    if (!isInstructor) {
      const transactions = await this._transactionRepository.findByUserId(senderId);
      isStudent = transactions.some((txn) => txn.courseId === courseId);
    }
  
    if (!isInstructor && !isStudent) {
      throw new Error("You must purchase the course or be the instructor to access this chat.");
    }
  

    if (!isInstructor) {
      throw new Error("You must purchase the course to chat with the instructor.");
    }
  
    const cacheKey = `chat:${courseId}:${senderId}:${receiverId}`;
    const cachedMessages = await this._redisClient.get(cacheKey);
    if (cachedMessages) {
      return JSON.parse(cachedMessages);
    }
  
    const messages = await this._chatRepository.findMessagesByCourseAndUsers(courseId, senderId, receiverId);
  
    await this._redisClient.set(cacheKey, JSON.stringify(messages), { EX: 3600 });
  
    return messages;
  }
  

  /**
   * This method sends a message from one user to another in a specific course
   * @param courseId 
   * @param senderId 
   * @param receiverId 
   * @param message 
   * @param isFile 
   * @param fileName 
   * @returns 
   */
  async sendMessage(courseId: string, senderId: string, receiverId: string, message: string, isFile: boolean, fileName?: string): Promise<IMessage> {

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
      isFile,
      fileName,
    };

    const savedMessage = await this._chatRepository.createMessage(chatMessage as IMessage);

    const cacheKey = `chat:${courseId}:${senderId}:${receiverId}`;
    await this._redisClient.del(cacheKey);
    const reverseCacheKey = `chat:${courseId}:${receiverId}:${senderId}`;
    await this._redisClient.del(reverseCacheKey);

    return savedMessage;
  }
}