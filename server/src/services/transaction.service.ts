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
import { getPaginationParams } from "../utils/paginationUtil";
import { TransactionResponse } from "../types/types";
import { Request } from "express";

// Interface for pagination query parameters
interface PaginationQuery {
  query: {
    page: string;
    limit: string;
    q: string;
  };
}

/**
 * Service for handling transactions related to course enrollments.
 * This service manages the creation of transactions, retrieval of earnings for admin and teachers,
 * and the purchases made by students.
 */
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

  /**
   * This method creates a transaction for a course enrollment.
   * @param userId
   * @param courseId
   * @param transactionId
   * @param amount
   * @param paymentProvider
   * @returns
   */
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
      const coursePattern = `course:${courseId}*`;

      const keysToDelete = await Promise.all([
        this._redisClient.keys(adminEarningsPattern),
        this._redisClient.keys(teacherEarningsPattern),
        this._redisClient.keys(studentPurchasesPattern),
        this._redisClient.keys(enrolledCoursesPattern),
        this._redisClient.keys(coursePattern),
      ]);

      // Flatten the array of arrays and delete all matching keys
      const allKeys = keysToDelete.flat();
      if (allKeys.length > 0) {
        await Promise.all(allKeys.map((key) => this._redisClient.del(key)));
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

  /**
   * This method retrieves the earnings for the admin.
   * @param page
   * @param limit
   * @param searchTerm
   * @returns
   */
  async getAdminEarnings(
    page: number = 1,
    limit: number = 10,
    searchTerm: string = ""
  ): Promise<{ transactions: TransactionResponse[]; total: number; totalPages: number }> {
    const cacheKey = `admin:earnings:${page}:${limit}:${searchTerm}`;
    const cachedData = await this._redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    try {
      const params = getPaginationParams({ query: { page: page.toString(), limit: limit.toString(), q: searchTerm } } as unknown as Request);
      
      // Fetch paginated transactions for the response
      const transactions = await this._transactionRepository.findAll(params.skip, params.limit);
      
      // Fetch all transactions to compute total after searchTerm filtering
      const allTransactions = await this._transactionRepository.findAll(0, 0);

      apiLogger.info("page-limit", { page: params.page, limit: params.limit });
      apiLogger.info("Search term", { searchTerm: params.searchTerm });

      // Enrich all transactions for total count
      const allEnrichedData = await Promise.all(
        allTransactions.map(async (txn) => {
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

      // Filter all enriched data to compute total
      let filteredTotalData = allEnrichedData;
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredTotalData = allEnrichedData.filter((item) =>
          item.transactionId.toLowerCase().includes(lowerSearchTerm) ||
          item.courseName.toLowerCase().includes(lowerSearchTerm) ||
          item.studentName.toLowerCase().includes(lowerSearchTerm) ||
          item.paymentProvider.toLowerCase().includes(lowerSearchTerm)
        );
      }
      const total = filteredTotalData.length;

      // Enrich paginated transactions for response
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

      apiLogger.info("Enriched data", { enrichedData });

      // Filter paginated data by search term
      let filteredData = enrichedData;
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredData = enrichedData.filter((item) =>
          item.transactionId.toLowerCase().includes(lowerSearchTerm) ||
          item.courseName.toLowerCase().includes(lowerSearchTerm) ||
          item.studentName.toLowerCase().includes(lowerSearchTerm) ||
          item.paymentProvider.toLowerCase().includes(lowerSearchTerm)
        );
      }

      const result = {
        transactions: filteredData,
        total,
        totalPages: Math.ceil(total / params.limit),
      };

      apiLogger.info("Admin earnings fetched successfully", { result });
      await this._redisClient.set(cacheKey, JSON.stringify(result), { EX: this._CACHE_TTL });
      return result;
    } catch (error) {
      apiLogger.error("Error fetching admin earnings", { error: (error as Error).message });
      await this._redisClient.del(cacheKey);
      throw error;
    }
  }

  /**
   * This method retrieves the earnings for a specific teacher.
   * @param teacherId
   * @param page
   * @param limit
   * @param searchTerm
   */
  async getTeacherEarnings(
    teacherId: string,
    page: number = 1,
    limit: number = 10,
    searchTerm: string = ""
  ): Promise<{ transactions: TransactionResponse[]; total: number; totalPages: number }> {
    const cacheKey = `teacher:earnings:${teacherId}:${page}:${limit}:${searchTerm}`;
    const cachedData = await this._redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    try {
      const params = getPaginationParams({ query: { page: page.toString(), limit: limit.toString(), q: searchTerm } } as unknown as Request);
      const teacherCourses = await this._courseRepository.findTeacherCourses(teacherId);
      const courseIds = teacherCourses.map((c) => c.courseId);

      // Fetch paginated transactions for the response
      const transactions = await this._transactionRepository.findByCourseIds(courseIds, params.skip, params.limit);

      // Fetch all teacher transactions to compute total
      const allTeacherTxns = await this._transactionRepository.findByCourseIds(courseIds, 0, 0);

      apiLogger.info("page-limit", { page: params.page, limit: params.limit });
      apiLogger.info("Search term", { searchTerm: params.searchTerm });

      // Enrich all transactions for total count
      const allEnrichedData = await Promise.all(
        allTeacherTxns.map(async (txn) => {
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

      // Filter all enriched data to compute total
      let filteredTotalData = allEnrichedData;
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredTotalData = allEnrichedData.filter((item) =>
          item.transactionId.toLowerCase().includes(lowerSearchTerm) ||
          item.courseName.toLowerCase().includes(lowerSearchTerm) ||
          item.studentName.toLowerCase().includes(lowerSearchTerm) ||
          item.paymentProvider.toLowerCase().includes(lowerSearchTerm)
        );
      }
      const total = filteredTotalData.length;

      // Enrich paginated transactions for response
      const enrichedData = await Promise.all(
        transactions.map(async (txn) => {
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

      // Filter paginated data by search term
      let filteredData = enrichedData;
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredData = enrichedData.filter((item) =>
          item.transactionId.toLowerCase().includes(lowerSearchTerm) ||
          item.courseName.toLowerCase().includes(lowerSearchTerm) ||
          item.studentName.toLowerCase().includes(lowerSearchTerm) ||
          item.paymentProvider.toLowerCase().includes(lowerSearchTerm)
        );
      }

      const result = {
        transactions: filteredData,
        total,
        totalPages: Math.ceil(total / params.limit),
      };

      apiLogger.info("Teacher earnings fetched successfully", { result });
      await this._redisClient.set(cacheKey, JSON.stringify(result), { EX: this._CACHE_TTL });
      return result;
    } catch (error) {
      apiLogger.error("Error fetching teacher earnings", { error: (error as Error).message });
      await this._redisClient.del(cacheKey);
      throw error;
    }
  }

  /**
   * This method retrieves the purchases made by a specific student.
   * @param userId
   * @param page
   * @param limit
   * @param searchTerm
   * @returns
   */
  async getStudentPurchases(
    userId: string,
    page: number = 1,
    limit: number = 10,
    searchTerm: string = ""
  ): Promise<{ transactions: TransactionResponse[]; total: number; totalPages: number }> {
    const cacheKey = `student:purchases:${userId}:${page}:${limit}:${searchTerm}`;
    const cachedData = await this._redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    try {
      const params = getPaginationParams({ query: { page: page.toString(), limit: limit.toString(), q: searchTerm } } as unknown as Request);

      // Fetch paginated transactions for the response
      const transactions = await this._transactionRepository.findByUserId(userId, params.skip, params.limit);

      // Fetch all user transactions to compute total
      const allTransactions = await this._transactionRepository.findByUserId(userId, 0, 0);

      apiLogger.info("page-limit", { page: params.page, limit: params.limit });
      apiLogger.info("Search term", { searchTerm: params.searchTerm });

      // Enrich all transactions for total count
      const allEnrichedData = await Promise.all(
        allTransactions.map(async (txn) => {
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

      // Filter all enriched data to compute total
      let filteredTotalData = allEnrichedData;
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredTotalData = allEnrichedData.filter((item) =>
          item.transactionId.toLowerCase().includes(lowerSearchTerm) ||
          item.courseName.toLowerCase().includes(lowerSearchTerm) ||
          item.teacherName.toLowerCase().includes(lowerSearchTerm) ||
          item.paymentProvider.toLowerCase().includes(lowerSearchTerm) ||
          item.status.toLowerCase().includes(lowerSearchTerm)
        );
      }
      const total = filteredTotalData.length;

      // Enrich paginated transactions for response
      const enrichedData = await Promise.all(
        transactions.map(async (txn) => {
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

      // Filter paginated data by search term
      let filteredData = enrichedData;
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredData = enrichedData.filter((item) =>
          item.transactionId.toLowerCase().includes(lowerSearchTerm) ||
          item.courseName.toLowerCase().includes(lowerSearchTerm) ||
          item.teacherName.toLowerCase().includes(lowerSearchTerm) ||
          item.paymentProvider.toLowerCase().includes(lowerSearchTerm) ||
          item.status.toLowerCase().includes(lowerSearchTerm)
        );
      }

      const result = {
        transactions: filteredData,
        total,
        totalPages: Math.ceil(total / params.limit),
      };

      apiLogger.info("Student purchases fetched successfully", { result });
      await this._redisClient.set(cacheKey, JSON.stringify(result), { EX: this._CACHE_TTL });
      return result;
    } catch (error) {
      apiLogger.error("Error fetching student purchases", { error: (error as Error).message });
      await this._redisClient.del(cacheKey);
      throw error;
    }
  }
}