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
import { format } from "date-fns";
import { apiLogger } from "../utils/logger";
@injectable()
export class TransactionService implements ITransactionService {
  private readonly _ADMIN_PERCENTAGE = 0.2; 
  private readonly _CACHE_TTL = 3600; 

  constructor(
    @inject(TYPES.ITransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository,
    @inject(TYPES.IUserCourseProgressRepository) private _userCourseProgressRepository: IUserCourseProgressRepository,
    @inject(TYPES.IAuthService) private _authService: IAuthService,
    @inject(TYPES.IRedisClient) private _redisClient: IRedisClient,
    private _notificationService: NotificationService
  ) {}

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
    if (lock !== "OK") {
      throw new Error("Transaction already in progress. Please wait for it to complete.");
    }

    try {
      const existingTransaction = await this._transactionRepository.findByUserId(userId);
      if (existingTransaction.some((t) => t.courseId === courseId)) {
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

      await this._courseRepository.addEnrollment(courseId, userId, user.name);

      // Invalidate all related caches using pattern matching
      const adminEarningsPattern = "admin:earnings*";
      const teacherEarningsPattern = `teacher:earnings:${course.teacherId}*`;
      const studentPurchasesPattern = `student:purchases:${userId}*`;
      const enrolledCoursesPattern = `enrolled:${userId}*`;
      
      const keysToDelete = await Promise.all([
        this._redisClient.keys(adminEarningsPattern),
        this._redisClient.keys(teacherEarningsPattern),
        this._redisClient.keys(studentPurchasesPattern),
        this._redisClient.keys(enrolledCoursesPattern)
      ]);

      // Flatten the array of arrays and delete all matching keys
      const allKeys = keysToDelete.flat();
      if (allKeys.length > 0) {
        await Promise.all(allKeys.map(key => this._redisClient.del(key)));
      }

      await CacheUtil.invalidateCourseListCaches();

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

  async getAdminEarnings(page: number = 1, limit: number = 10, searchTerm: string = ""): Promise<{ transactions: any[]; total: number; totalPages: number }> {
    const cacheKey = `admin:earnings:${page}:${limit}:${searchTerm}`;
    const cachedData = await this._redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const skip = (page - 1) * limit;
    const transactions = await this._transactionRepository.findAll(skip, limit);
    const total = await this._transactionRepository.countAll();
    const totalPages = Math.ceil(total / limit);
    
    const enrichedData = await Promise.all(
      transactions.map(async (txn) => {
        const course = await this._courseRepository.findById(txn.courseId);
        const student = await this._authService.findUserById(txn.userId);
        return {
          transactionId: txn.transactionId,
          date: format(new Date(txn.dateTime), "yyyy-MM-dd HH:mm"),
          courseName: course?.title || "Unknown",
          studentName: student?.name || "Unknown",
          totalAmount: txn.amount,
          earning: txn.amount * this._ADMIN_PERCENTAGE,
          paymentProvider: txn.paymentProvider,
        };
      })
    );

    // Filter by search term if provided
    let filteredData = enrichedData;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredData = enrichedData.filter(item => 
        item.transactionId.toLowerCase().includes(lowerSearchTerm) ||
        item.courseName.toLowerCase().includes(lowerSearchTerm) ||
        item.studentName.toLowerCase().includes(lowerSearchTerm) ||
        item.paymentProvider.toLowerCase().includes(lowerSearchTerm)
      );
    }

    const result = {
      transactions: filteredData,
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / limit)
    };

    await this._redisClient.set(cacheKey, JSON.stringify(result), { EX: this._CACHE_TTL });
    return result;
  }

  async getTeacherEarnings(teacherId: string, page: number = 1, limit: number = 10, searchTerm: string = ""): Promise<{ transactions: any[]; total: number; totalPages: number }> {
    const cacheKey = `teacher:earnings:${teacherId}:${page}:${limit}:${searchTerm}`;
    const cachedData = await this._redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const skip = (page - 1) * limit;
    const teacherCourses = await this._courseRepository.findTeacherCourses(teacherId);
    const courseIds = teacherCourses.map((c) => c.courseId);
    const transactions = await this._transactionRepository.findAll(skip, limit);
    const teacherTxns = transactions.filter((txn) => courseIds.includes(txn.courseId));
    
    const enrichedData = await Promise.all(
      teacherTxns.map(async (txn) => {
        const course = await this._courseRepository.findById(txn.courseId);
        const student = await this._authService.findUserById(txn.userId);
        return {
          transactionId: txn.transactionId,
          date: format(new Date(txn.dateTime), "yyyy-MM-dd HH:mm"),
          courseName: course?.title || "Unknown",
          studentName: student?.name || "Unknown",
          earning: txn.amount * (1 - this._ADMIN_PERCENTAGE),
          paymentProvider: txn.paymentProvider,
        };
      })
    );

    // Filter by search term if provided
    let filteredData = enrichedData;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredData = enrichedData.filter(item => 
        item.transactionId.toLowerCase().includes(lowerSearchTerm) ||
        item.courseName.toLowerCase().includes(lowerSearchTerm) ||
        item.studentName.toLowerCase().includes(lowerSearchTerm) ||
        item.paymentProvider.toLowerCase().includes(lowerSearchTerm)
      );
    }

    const result = {
      transactions: filteredData,
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / limit)
    };

    await this._redisClient.set(cacheKey, JSON.stringify(result), { EX: this._CACHE_TTL });
    return result;
  }

  async getStudentPurchases(userId: string, page: number = 1, limit: number = 10, searchTerm: string = ""): Promise<{ transactions: any[]; total: number; totalPages: number }> {
    const cacheKey = `student:purchases:${userId}:${page}:${limit}:${searchTerm}`;
    const cachedData = await this._redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const skip = (page - 1) * limit;
    const transactions = await this._transactionRepository.findByUserId(userId);
    apiLogger.info("Transactions fetched successfully");
    const paginatedTransactions = transactions.slice(skip, skip + limit);
    
    const enrichedData = await Promise.all(
      paginatedTransactions.map(async (txn) => {
        const course = await this._courseRepository.findById(txn.courseId);

        return {
          transactionId: txn.transactionId,
          date: format(new Date(txn.dateTime), "yyyy-MM-dd HH:mm"),
          courseName: course?.title || "Unknown",
          teacherName: course?.teacherName || "Unknown",
          amount: txn.amount,
          paymentProvider: txn.paymentProvider,
          status: "Completed",
        };
      })
    );

    // Filter by search term if provided
    let filteredData = enrichedData;
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredData = enrichedData.filter(item => 
        item.transactionId.toLowerCase().includes(lowerSearchTerm) ||
        item.courseName.toLowerCase().includes(lowerSearchTerm) ||
        item.teacherName.toLowerCase().includes(lowerSearchTerm) ||
        item.paymentProvider.toLowerCase().includes(lowerSearchTerm) ||
        item.status.toLowerCase().includes(lowerSearchTerm)
      );
    }

    const result = {
      transactions: filteredData,
      total: transactions.length,
      totalPages: Math.ceil(transactions.length / limit)
    };
    apiLogger.info("Result fetched successfully");
    await this._redisClient.set(cacheKey, JSON.stringify(result), { EX: this._CACHE_TTL });
    return result;
  }
}