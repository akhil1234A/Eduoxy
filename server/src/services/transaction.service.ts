import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ITransactionRepository } from "../interfaces/transaction.repository";
import { ICourseRepository } from "../interfaces/course.repository";
import { IUserCourseProgressRepository } from "../interfaces/courseProgress.repository";
import { ITransactionService } from "../interfaces/transaction.service";
import { ITransaction } from "../models/transaction.model";
import { NotificationService } from "./notification.service";
import { IAuthService } from "../interfaces/auth.service";
import { IRedisClient } from "../config/redis";
import { CacheUtil } from "../utils/cache";
@injectable()
export class TransactionService implements ITransactionService {
  constructor(
    @inject(TYPES.ITransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository,
    @inject(TYPES.IUserCourseProgressRepository) private _userCourseProgressRepository: IUserCourseProgressRepository,
    @inject(TYPES.IAuthService) private _authService: IAuthService,
    @inject(TYPES.IRedisClient) private _redisClient:IRedisClient,
    private _notificationService: NotificationService,
  ) {}

  async listTransactions(userId?: string): Promise<ITransaction[]> {
    return userId ? this._transactionRepository.findByUserId(userId) : this._transactionRepository.findAll();
  }

  async createTransaction(
    userId: string,
    courseId: string,
    transactionId: string,
    amount: number,
    paymentProvider: "stripe"
  ): Promise<ITransaction> {

    const lockKey = `lock:transaction:${userId}:${courseId}`;
    const lockExpiration = 60;

    const lock = await this._redisClient.set(lockKey, "locked", { EX: lockExpiration });
    if((lock !== "OK")){
      throw new Error("Transaction already in progress. Please wait for it to complete.");
    }

    try {

    const existingTransaction = await this._transactionRepository.findByUserId(userId);
    if(existingTransaction.some(t => t.courseId === courseId)){
      throw new Error("You have already enrolled in this course.");
    }

    const course = await this._courseRepository.findById(courseId);
    if (!course) throw new Error("Course not found");

    const user = await this._authService.findUserById(userId);
    if (!user) throw new Error("User not found");

    const transactionData = {
      userId,
      transactionId,
      dateTime: new Date().toISOString(),
      courseId,
      amount,
      paymentProvider,
    };
    const savedTransaction = await this._transactionRepository.create(transactionData);

    const initialProgress = {
      userId,
      courseId,
      enrollmentDate: new Date().toISOString(),
      overallProgress: 0,
      sections: course.sections.map((section) => ({
        sectionId: section.sectionId,
        chapters: section.chapters.map((chapter) => ({
          chapterId: chapter.chapterId,
          completed: false,
        })),
      })),
      lastAccessedTimestamp: new Date().toISOString(),
    };
    await this._userCourseProgressRepository.saveUserCourseProgress(initialProgress);

    await this._courseRepository.addEnrollment(courseId, userId);

    await CacheUtil.invalidateCourseListCaches();

    // Send notification to course teacher
    await this._notificationService.createNotification({
      userId: course.teacherId,
      title: "New Enrollment",
      message: `${user.name} has enrolled in your course "${course.title}"`,
      type: "success",
      link: `/teacher/courses/${course.courseId}/students`,
    });

    return savedTransaction;
    } finally {
      await this._redisClient.del(lockKey);
    }
  }
}