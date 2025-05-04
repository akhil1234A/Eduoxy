import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ITransactionRepository } from "../interfaces/transaction.repository";
import { ITransaction } from "../models/transaction.model";
import { ICourseRepository } from "../interfaces/course.repository";
import { IUserRepository } from "../interfaces/user.repository";
import { IAuthService } from "../interfaces/auth.service";
import { IDashboardService } from "../interfaces/dashboard.service";
import {
  format,
  subDays,
  subMonths,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  parse,
  isValid,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { UserRole, CourseStatus } from "../types/types";
import { CacheUtil } from "../utils/cache";

@injectable()
export class DashboardService implements IDashboardService {
  private readonly _ADMIN_PERCENTAGE = 0.2;
  private readonly _CACHE_TTL = 3600; // 1 hour TTL in seconds

  constructor(
    @inject(TYPES.ITransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository,
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
    @inject(TYPES.IAuthService) private _authService: IAuthService
  ) {}

  private getDateRange(dateFilter?: {
    type: "day" | "week" | "month" | "custom";
    startDate?: string;
    endDate?: string;
  }): { startDate: string; endDate: string } {
    const now = new Date();
    let startDate = format(subDays(now, 30), "yyyy-MM-dd"); // Default to last 30 days
    let endDate = format(now, "yyyy-MM-dd");

    if (dateFilter) {
      if (dateFilter.type === "day") {
        startDate = format(subDays(now, 30), "yyyy-MM-dd"); // Last 30 days for daily
      } else if (dateFilter.type === "week") {
        startDate = format(subDays(now, 7), "yyyy-MM-dd"); // Last 7 days for transactions
      } else if (dateFilter.type === "month") {
        startDate = format(subDays(now, 30), "yyyy-MM-dd"); // Last 30 days for transactions
      } else if (dateFilter.type === "custom" && dateFilter.startDate && dateFilter.endDate) {
        const start = parse(dateFilter.startDate, "yyyy-MM-dd", new Date());
        const end = parse(dateFilter.endDate, "yyyy-MM-dd", new Date());
        if (!isValid(start) || !isValid(end)) {
          throw new Error("Invalid custom date format. Use YYYY-MM-DD");
        }
        if (start > end) {
          throw new Error("startDate cannot be after endDate");
        }
        startDate = dateFilter.startDate;
        endDate = dateFilter.endDate;
      } else {
        throw new Error("Custom date filter requires valid startDate and endDate");
      }
    }

    return { startDate, endDate };
  }

  private async formatTransactionData(
    transactions: any[],
    isTeacher: boolean = false
  ): Promise<any[]> {
    return Promise.all(
      transactions.map(async (txn) => {
        const course = await this._courseRepository.findById(txn.courseId);
        const student = await this._authService.findUserById(txn.userId);
        return {
          [isTeacher ? "enrollmentId" : "transactionId"]: txn.transactionId,
          date: format(new Date(txn.dateTime), "yyyy-MM-dd HH:mm"),
          courseName: course?.title || "Unknown",
          studentName: student?.name || "Unknown",
          [isTeacher ? "earning" : "amount"]: isTeacher
            ? txn.amount * (1 - this._ADMIN_PERCENTAGE)
            : txn.amount,
        };
      })
    );
  }

  private async getFilteredTransactions(
    skip: number,
    limit: number,
    dateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string },
    teacherCourses?: any[]
  ): Promise<{ transactions: any[]; total: number }> {
    let filteredTxns: any[] = [];
    let total = 0;

    if (dateFilter) {
      const { startDate, endDate } = this.getDateRange(dateFilter);
      const { transactions, total: txTotal } = await this._transactionRepository.findByDateRange(
        startDate,
        endDate,
        skip,
        limit
      );
      filteredTxns = teacherCourses
        ? transactions.filter((txn) => teacherCourses.some((c) => c.courseId === txn.courseId))
        : transactions;
      total = teacherCourses ? filteredTxns.length : txTotal;
    } else {
      const allTransactions = await this._transactionRepository.findAll(skip, limit);
      filteredTxns = teacherCourses
        ? allTransactions.filter((txn) => teacherCourses.some((c) => c.courseId === txn.courseId))
        : allTransactions;
      total = teacherCourses ? filteredTxns.length : await this._transactionRepository.countAll();
    }

    return { transactions: filteredTxns, total };
  }

  private async getRevenueGraphData(
    transactions: any[],
    dateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string },
    isTeacher: boolean = false
  ): Promise<{ labels: string[]; data: number[] }> {
    const { startDate, endDate } = this.getDateRange(dateFilter);
    const start = parse(startDate, "yyyy-MM-dd", new Date());
    const end = parse(endDate, "yyyy-MM-dd", new Date());

    let labels: string[] = [];
    let data: number[] = [];

    if (dateFilter?.type === "week") {
      // Weekly revenue
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      labels = weeks.map((week) => format(week, "MMM dd, yyyy"));
      data = weeks.map((week) => {
        const weekStart = startOfWeek(week, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(week, { weekStartsOn: 1 });
        return transactions
          .filter(
            (txn) =>
              new Date(txn.dateTime) >= weekStart && new Date(txn.dateTime) <= weekEnd
          )
          .reduce(
            (sum, txn) =>
              sum + (isTeacher ? txn.amount * (1 - this._ADMIN_PERCENTAGE) : txn.amount),
            0
          );
      });
    } else if (dateFilter?.type === "month") {
      // Monthly revenue
      const months = eachMonthOfInterval({ start, end });
      labels = months.map((month) => format(month, "MMM yyyy"));
      data = months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        return transactions
          .filter(
            (txn) =>
              new Date(txn.dateTime) >= monthStart && new Date(txn.dateTime) <= monthEnd
          )
          .reduce(
            (sum, txn) =>
              sum + (isTeacher ? txn.amount * (1 - this._ADMIN_PERCENTAGE) : txn.amount),
            0
          );
      });
    } else {
      // Daily revenue (for "day" or "custom")
      const days = eachDayOfInterval({ start, end });
      labels = days.map((day) => format(day, "MMM dd, yyyy"));
      data = days.map((day) => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        return transactions
          .filter(
            (txn) => new Date(txn.dateTime) >= dayStart && new Date(txn.dateTime) <= dayEnd
          )
          .reduce(
            (sum, txn) =>
              sum + (isTeacher ? txn.amount * (1 - this._ADMIN_PERCENTAGE) : txn.amount),
            0
          );
      });
    }

    return { labels, data };
  }

  private async getTopSellingCourses(
    transactions: any[],
    courses: any[],
    isTeacher: boolean = false
  ): Promise<{ name: string; revenue: number; enrollments: number }[]> {
    const courseStats = courses.map((course) => {
      const courseTxns = transactions.filter((txn) => txn.courseId === course.courseId);
      const revenue = courseTxns.reduce(
        (sum, txn) =>
          sum + (isTeacher ? txn.amount * (1 - this._ADMIN_PERCENTAGE) : txn.amount),
        0
      );
      const enrollments = courseTxns.length;
      return { name: course.title, revenue, enrollments };
    });

    return courseStats
      .filter((stat) => stat.enrollments > 0)
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);
  }

  async getAdminDashboard(
    page: number = 1,
    limit: number = 10,
    dateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string },
    tableDateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string }
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const cacheKey = `admin_dashboard:${JSON.stringify({ page, limit, dateFilter, tableDateFilter })}`;

    const cachedData = await CacheUtil.get<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const transactionsCacheKey = `transactions:all`;
    let allTransactions = await CacheUtil.get<ITransaction[]>(transactionsCacheKey);
    if (!allTransactions) {
      allTransactions = await this._transactionRepository.findAll(0, 1000);
      await CacheUtil.set(transactionsCacheKey, allTransactions, this._CACHE_TTL);
    }

    const [courses, users, teachers] = await Promise.all([
      this._courseRepository.findPublicCourses(),
      this._userRepository.listByUserType(UserRole.STUDENT, 0, 100),
      this._userRepository.listByUserType(UserRole.TEACHER, 0, 100),
    ]);

    const totalRevenue = allTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    const activeCourses = courses.length;
    const totalEnrollments = courses.reduce(
      (sum, course) => sum + (course.enrollments?.length || 0),
      0
    );
    const totalUsers = users.length + teachers.length;

    const { transactions, total } = await this.getFilteredTransactions(skip, limit, tableDateFilter);
    const recentTransactions = await this.formatTransactionData(transactions);

    const [revenueGraph, topCourses] = await Promise.all([
      this.getRevenueGraphData(allTransactions, dateFilter),
      this.getTopSellingCourses(allTransactions, courses),
    ]);

    const result = {
      totalRevenue,
      activeCourses,
      totalEnrollments,
      totalUsers,
      recentTransactions,
      revenueGraph,
      topCourses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await CacheUtil.set(cacheKey, result, this._CACHE_TTL);
    return result;
  }

  async getTeacherDashboard(
    teacherId: string,
    page: number = 1,
    limit: number = 10,
    dateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string },
    tableDateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string }
  ): Promise<any> {
    const skip = (page - 1) * limit;
    const cacheKey = `teacher_dashboard:${teacherId}:${JSON.stringify({ page, limit, dateFilter, tableDateFilter })}`;

    const cachedData = await CacheUtil.get<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const transactionsCacheKey = `transactions:all`;
    let allTransactions = await CacheUtil.get<ITransaction[]>(transactionsCacheKey);
    if (!allTransactions) {
      allTransactions = await this._transactionRepository.findAll(0, 1000);
      await CacheUtil.set(transactionsCacheKey, allTransactions, this._CACHE_TTL);
    }

    const teacherCourses = await this._courseRepository.findTeacherCourses(teacherId);
    const teacherTxns = allTransactions.filter((txn) =>
      teacherCourses.some((c) => c.courseId === txn.courseId)
    );

    const totalEarnings = teacherTxns.reduce(
      (sum, txn) => sum + txn.amount * (1 - this._ADMIN_PERCENTAGE),
      0
    );
    const totalStudents = teacherTxns.length;
    const totalCourses = teacherCourses.length;
    const pendingCourses = teacherCourses.filter(
      (c) => c.status !== CourseStatus.Published
    ).length;

    const { transactions, total } = await this.getFilteredTransactions(
      skip,
      limit,
      tableDateFilter,
      teacherCourses
    );
    const recentEnrollments = await this.formatTransactionData(transactions, true);

    const [revenueGraph, topCourses] = await Promise.all([
      this.getRevenueGraphData(teacherTxns, dateFilter, true),
      this.getTopSellingCourses(teacherTxns, teacherCourses, true),
    ]);

    const result = {
      totalEarnings,
      totalStudents,
      totalCourses,
      pendingCourses,
      recentEnrollments,
      revenueGraph,
      topCourses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await CacheUtil.set(cacheKey, result, this._CACHE_TTL);
    return result;
  }
}