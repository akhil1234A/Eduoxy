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
import { UserRole, CourseStatus, UserDashboardResponse, TeacherDashboardResponse, AdminDashboardResponse, RecentTransactionAdmin, RecentEnrollmentTeacher, Course, SectionProgress, ChapterProgress, UserCourseProgress, Certificate } from "../types/types";
import { CacheUtil } from "../utils/cache";
import { IUserCourseProgressRepository } from "../interfaces/courseProgress.repository";
import { ICertificateRepository } from "../interfaces/certificate.repository";
import { TimeTrackingRepository } from "../repositories/timeTracking.repository";

/**
 * This is a service responsible for managing dashboard functionalities
 * It handles retrieving and formatting data for admin, teacher, and user dashboards
 */
@injectable()
export class DashboardService implements IDashboardService {
  private readonly _ADMIN_PERCENTAGE = 0.2;
  private readonly _CACHE_TTL = 3600; // 1 hour TTL in seconds

  constructor(
    @inject(TYPES.ITransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository,
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
    @inject(TYPES.IAuthService) private _authService: IAuthService,
    @inject(TYPES.IUserCourseProgressRepository) private _userCourseProgressRepository: IUserCourseProgressRepository,
    @inject(TYPES.ICertificateRepository) private _certificateRepository: ICertificateRepository,
    @inject(TYPES.TimeTrackingRepository) private _timeTrackingRepository: TimeTrackingRepository
  ) {}

  /**
   * This is a private method that retrieves the date range based on the provided date filter
   * @param dateFilter 
   * @returns 
   */
  private getDateRange(dateFilter?: {
    type: "day" | "week" | "month" | "custom";
    startDate?: string;
    endDate?: string;
  }): { startDate: string; endDate: string } {
    const now = new Date();
    let startDate = format(subDays(now, 30), "yyyy-MM-dd"); 
    let endDate = format(now, "yyyy-MM-dd");

    if (dateFilter) {
      if (dateFilter.type === "day") {
        startDate = format(subDays(now, 30), "yyyy-MM-dd"); 
      } else if (dateFilter.type === "week") {
        startDate = format(subDays(now, 7), "yyyy-MM-dd"); 
      } else if (dateFilter.type === "month") {
        startDate = format(subDays(now, 30), "yyyy-MM-dd"); 
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

  /**
   * This is a private method that formats transaction data for display
   * @param transactions 
   * @param isTeacher 
   * @returns 
   */
  private async formatTransactionData(
    transactions: ITransaction[],
    isTeacher: boolean = false
  ): Promise<RecentTransactionAdmin[] | RecentEnrollmentTeacher[]> {
    return Promise.all(
      transactions.map(async (txn) => {
        const course = await this._courseRepository.findById(txn.courseId);
        const student = await this._authService.findUserById(txn.userId);
        if (isTeacher) {
          return {
            enrollmentId: txn.transactionId,
            date: format(new Date(txn.dateTime), "yyyy-MM-dd HH:mm"),
            courseName: course?.title || "Unknown",
            studentName: student?.name || "Unknown",
            earning: txn.amount * (1 - this._ADMIN_PERCENTAGE),
          } as RecentEnrollmentTeacher;
        }
        return {
          transactionId: txn.transactionId,
          date: format(new Date(txn.dateTime), "yyyy-MM-dd HH:mm"),
          courseName: course?.title || "Unknown",
          studentName: student?.name || "Unknown",
          amount: txn.amount,
        } as RecentTransactionAdmin;
      })
    );
  }

  /**
   * This is a private method that retrieves filtered transactions based on the provided parameters
   * @param skip 
   * @param limit 
   * @param dateFilter 
   * @param teacherCourses 
   * @returns 
   */
  private async getFilteredTransactions(
    skip: number,
    limit: number,
    dateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string },
    teacherCourses?: Course[]
  ): Promise<{ transactions: ITransaction[]; total: number }> {
    let filteredTxns: ITransaction[] = [];
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

  /**
   * This a private method that retrieves revenue graph data based on the provided transactions and date filter
   * @param transactions 
   * @param dateFilter 
   * @param isTeacher 
   * @returns 
   */
  private async getRevenueGraphData(
    transactions: ITransaction[],
    dateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string },
    isTeacher: boolean = false
  ): Promise<{ labels: string[]; data: number[] }> {
    const { startDate, endDate } = this.getDateRange(dateFilter);
    const start = parse(startDate, "yyyy-MM-dd", new Date());
    const end = parse(endDate, "yyyy-MM-dd", new Date());

    let labels: string[] = [];
    let data: number[] = [];

    if (dateFilter?.type === "week") {
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

  /**
   * This is a private method that retrieves the top-selling courses based on the provided transactions and courses
   * @param transactions 
   * @param courses 
   * @param isTeacher 
   * @returns 
   */
  private async getTopSellingCourses(
    transactions: ITransaction[],
    courses: Course[],
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

  /**
   * This is a public method that retrieves the admin dashboard data
   * @param page 
   * @param limit 
   * @param dateFilter 
   * @param tableDateFilter 
   * @returns 
   */
  async getAdminDashboard(
    page: number = 1,
    limit: number = 10,
    dateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string },
    tableDateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string }
  ): Promise<AdminDashboardResponse> {
    const skip = (page - 1) * limit;
    const cacheKey = `admin_dashboard:${JSON.stringify({ page, limit, dateFilter, tableDateFilter })}`;

    const cachedData = await CacheUtil.get<AdminDashboardResponse>(cacheKey);
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
    const recentTransactions = await this.formatTransactionData(transactions) as RecentTransactionAdmin[];

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

  /** 
   * This is a public method that retrieves the teacher dashboard data
   * @param teacherId
   * @param page
   * @param limit
   * @param dateFilter
   * @param tableDateFilter
   */
  async getTeacherDashboard(
    teacherId: string,
    page: number = 1,
    limit: number = 10,
    dateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string },
    tableDateFilter?: { type: "day" | "week" | "month" | "custom"; startDate?: string; endDate?: string }
  ): Promise<TeacherDashboardResponse> {
    const skip = (page - 1) * limit;
    const cacheKey = `teacher_dashboard:${teacherId}:${JSON.stringify({ page, limit, dateFilter, tableDateFilter })}`;

    const cachedData = await CacheUtil.get<TeacherDashboardResponse>(cacheKey);
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
    const recentEnrollments = await this.formatTransactionData(transactions, true) as RecentEnrollmentTeacher[];

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

  /**
   * This is a public method that retrieves the user dashboard data
   * @param userId 
   * @returns 
   */
  async getUserDashboard(userId: string): Promise<UserDashboardResponse> {
    const [coursesWithProgress, certificates, totalTimeSpent] = await Promise.all([
      this._userCourseProgressRepository.getEnrolledCoursesWithProgress(userId, 0, 100),
      this._certificateRepository.findByUserId(userId, 1, 100),
      this._timeTrackingRepository.getTotalTimeSpent(userId),
    ]);

    const enrolledCourses = await Promise.all(
      coursesWithProgress.map(async ({ course, progress }: { course: any; progress: any }) => {
        const courseTimeSpent = await this._timeTrackingRepository.getTotalTimeSpent(userId, course.courseId || course._id);
        return {
          courseId: course.courseId || course._id,
          title: course.title || "Unknown",
          progress: Number((progress?.overallProgress || 0).toFixed(2)),
          completed: progress?.overallProgress === 100,
          lastAccessed: progress?.lastAccessedTimestamp || new Date().toISOString(),
          enrollmentDate: progress?.enrollmentDate || new Date().toISOString(),
          timeSpent: {
            hours: Math.floor(courseTimeSpent / 3600),
            minutes: Math.floor((courseTimeSpent % 3600) / 60),
          },
        };
      })
    );

    const timeSpent = {
      hours: Math.floor(totalTimeSpent / 3600),
      minutes: Math.floor((totalTimeSpent % 3600) / 60),
    };

    const completedChapters = coursesWithProgress.reduce((total: number, { progress }: { course: any; progress: any }) => {
      if (!progress) return total;
      return (
        total +
        progress.sections.reduce((sectionTotal: number, section: SectionProgress) => {
          return sectionTotal + section.chapters.filter((chapter: ChapterProgress) => chapter.completed).length;
        }, 0)
      );
    }, 0);

    const certificatesEarned = certificates.certificates.map((cert: any) => ({
      certificateId: cert.certificateId,
      courseId: cert.courseId,
      courseName: cert.courseName,
      certificateUrl: cert.certificateUrl,
      issuedAt: format(cert.issuedAt, "yyyy-MM-dd"),
    }));

    const result = {
      timeSpent,
      completedChapters,
      certificatesEarned: certificatesEarned.length,
      certificates: certificatesEarned,
      enrolledCourses: {
        startLearning: enrolledCourses
          .filter((course) => course.progress === 0 && !course.completed)
          .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime())
          .slice(0, 3),
        continueLearning: enrolledCourses
          .filter((course) => course.progress > 0 && !course.completed)
          .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
          .slice(0, 3),
        completedCourses: enrolledCourses
          .filter((course) => course.completed)
          .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()),
      },
    };

    return result;
  }
}