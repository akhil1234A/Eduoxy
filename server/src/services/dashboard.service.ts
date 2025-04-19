import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ITransactionRepository } from "../interfaces/transaction.repository";
import { ICourseRepository } from "../interfaces/course.repository";
import { IUserRepository } from "../interfaces/user.repository";
import { IAuthService } from "../interfaces/auth.service";
import { IDashboardService } from "../interfaces/dashboard.service";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { UserRole, CourseStatus } from "../types/types";

@injectable()
export class DashboardService implements IDashboardService {
  private readonly _ADMIN_PERCENTAGE = 0.2; 

  constructor(
    @inject(TYPES.ITransactionRepository) private _transactionRepository: ITransactionRepository,
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository,
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
    @inject(TYPES.IAuthService) private _authService: IAuthService,
  ) {}

  async getAdminDashboard(
    page: number = 1,
    limit: number = 10,
    dateFilter?: { type: 'week' | 'month' | 'custom', startDate?: string, endDate?: string }
  ): Promise<any> {
    const skip = (page - 1) * limit;
    
    // Get all transactions for total revenue calculation
    const allTransactions = await this._transactionRepository.findAll(0, 1000);
    const courses = await this._courseRepository.findPublicCourses();
    const users = await this._userRepository.listByUserType(UserRole.STUDENT, 0, 100); 
    const teachers = await this._userRepository.listByUserType(UserRole.TEACHER, 0, 100);

    const totalRevenue = allTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    const activeCourses = courses.length;
    const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrollments?.length || 0), 0);
    const totalUsers = users.length + teachers.length;
    
    // Apply date filtering for recent transactions
    let startDate = '';
    let endDate = '';
    
    if (dateFilter) {
      const now = new Date();
      
      if (dateFilter.type === 'week') {
        startDate = format(subDays(now, 7), 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
      } else if (dateFilter.type === 'month') {
        startDate = format(subMonths(now, 1), 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
      } else if (dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate) {
        startDate = dateFilter.startDate;
        endDate = dateFilter.endDate;
      }
    }
    
    // Get filtered transactions with pagination
    const { transactions, total } = dateFilter 
      ? await this._transactionRepository.findByDateRange(startDate, endDate, skip, limit)
      : { transactions: allTransactions.slice(skip, skip + limit), total: allTransactions.length };

    const recentTransactions = await Promise.all(
      transactions.map(async (txn) => {
        const course = await this._courseRepository.findById(txn.courseId);
        const student = await this._authService.findUserById(txn.userId);
        return {
          transactionId: txn.transactionId,
          date: format(new Date(txn.dateTime), "yyyy-MM-dd HH:mm"),
          courseName: course?.title || "Unknown",
          studentName: student?.name || "Unknown",
          amount: txn.amount,
        };
      })
    );

    const dashboardData = {
      totalRevenue,
      activeCourses,
      totalEnrollments,
      totalUsers,
      recentTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    return dashboardData;
  }

  async getTeacherDashboard(
    teacherId: string,
    page: number = 1,
    limit: number = 10,
    dateFilter?: { type: 'week' | 'month' | 'custom', startDate?: string, endDate?: string }
  ): Promise<any> {
    const skip = (page - 1) * limit;
    
    const teacherCourses = await this._courseRepository.findTeacherCourses(teacherId);
    
    // Get all transactions for total earnings calculation
    const allTransactions = await this._transactionRepository.findAll(0, 1000);
    const teacherTxns = allTransactions.filter((txn) => teacherCourses.some((c) => c.courseId === txn.courseId));

    const totalEarnings = teacherTxns.reduce((sum, txn) => sum + txn.amount * (1 - this._ADMIN_PERCENTAGE), 0);
    const totalStudents = teacherTxns.length; 
    const totalCourses = teacherCourses.length;
    const pendingCourses = teacherCourses.filter((c) => c.status !== CourseStatus.Published).length;

    // Apply date filtering for recent enrollments
    let startDate = '';
    let endDate = '';
    
    if (dateFilter) {
      const now = new Date();
      
      if (dateFilter.type === 'week') {
        startDate = format(subDays(now, 7), 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
      } else if (dateFilter.type === 'month') {
        startDate = format(subMonths(now, 1), 'yyyy-MM-dd');
        endDate = format(now, 'yyyy-MM-dd');
      } else if (dateFilter.type === 'custom' && dateFilter.startDate && dateFilter.endDate) {
        startDate = dateFilter.startDate;
        endDate = dateFilter.endDate;
      }
    }
    
    // Filter transactions by teacher and date range
    let filteredTxns = teacherTxns;
    if (dateFilter) {
      filteredTxns = teacherTxns.filter(txn => {
        const txnDate = new Date(txn.dateTime);
        return txnDate >= new Date(startDate) && txnDate <= new Date(endDate);
      });
    }
    
    // Apply pagination
    const paginatedTxns = filteredTxns.slice(skip, skip + limit);
    const total = filteredTxns.length;

    const recentEnrollments = await Promise.all(
      paginatedTxns.map(async (txn) => {
        const course = await this._courseRepository.findById(txn.courseId);
        const student = await this._authService.findUserById(txn.userId);
        return {
          enrollmentId: txn.transactionId,
          studentName: student?.name || "Unknown",
          courseName: course?.title || "Unknown",
          date: format(new Date(txn.dateTime), "yyyy-MM-dd HH:mm"),
          earning: txn.amount * (1 - this._ADMIN_PERCENTAGE),
        };
      })
    );

    const dashboardData = {
      totalEarnings,
      totalStudents,
      totalCourses,
      pendingCourses,
      recentEnrollments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    return dashboardData;
  }
}