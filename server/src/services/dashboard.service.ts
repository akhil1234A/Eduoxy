import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ITransactionRepository } from "../interfaces/transaction.repository";
import { ICourseRepository } from "../interfaces/course.repository";
import { IUserRepository } from "../interfaces/user.repository";
import { IAuthService } from "../interfaces/auth.service";
import { IDashboardService } from "../interfaces/dashboard.service";
import { format } from "date-fns";
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

  async getAdminDashboard(): Promise<any> {


    const transactions = await this._transactionRepository.findAll();
    const courses = await this._courseRepository.findPublicCourses();
    const users = await this._userRepository.listByUserType(UserRole.STUDENT); 
    const teachers = await this._userRepository.listByUserType(UserRole.TEACHER);

    const totalRevenue = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    const activeCourses = courses.length;
    const totalEnrollments = courses.reduce((sum, course) => sum + (course.enrollments?.length || 0), 0);
    const totalUsers = users.length + teachers.length;
    

    const recentTransactions = transactions
      .slice(0, 5)
      .map(async (txn) => {
        const course = await this._courseRepository.findById(txn.courseId);
        const student = await this._authService.findUserById(txn.userId);
        return {
          transactionId: txn.transactionId,
          date: format(new Date(txn.dateTime), "yyyy-MM-dd HH:mm"),
          courseName: course?.title || "Unknown",
          studentName: student?.name || "Unknown",
          amount: txn.amount,
        };
      });

    const dashboardData = {
      totalRevenue,
      activeCourses,
      totalEnrollments,
      totalUsers,
      recentTransactions: await Promise.all(recentTransactions),
    };

    return dashboardData;
  }

  async getTeacherDashboard(teacherId: string): Promise<any> {
    

    const teacherCourses = await this._courseRepository.findTeacherCourses(teacherId);
    const transactions = await this._transactionRepository.findAll();
    const teacherTxns = transactions.filter((txn) => teacherCourses.some((c) => c.courseId === txn.courseId));

    const totalEarnings = teacherTxns.reduce((sum, txn) => sum + txn.amount * (1 - this._ADMIN_PERCENTAGE), 0);
    const totalStudents = teacherTxns.length; 
    const totalCourses = teacherCourses.length;
    const pendingCourses = teacherCourses.filter((c) => c.status !== CourseStatus.Published).length;

    const recentEnrollments = teacherTxns
      .slice(0, 5)
      .map(async (txn) => {
        const course = await this._courseRepository.findById(txn.courseId);
        const student = await this._authService.findUserById(txn.userId);
        return {
          studentName: student?.name || "Unknown",
          courseName: course?.title || "Unknown",
          date: format(new Date(txn.dateTime), "yyyy-MM-dd HH:mm"),
          earning: txn.amount * (1 - this._ADMIN_PERCENTAGE),
        };
      });

    const dashboardData = {
      totalEarnings,
      totalStudents,
      totalCourses,
      pendingCourses,
      recentEnrollments: await Promise.all(recentEnrollments),
    };

    return dashboardData;
  }
}