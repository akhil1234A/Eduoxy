import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ITransactionRepository } from "../interfaces/transaction.repository";
import { ICourseRepository } from "../interfaces/course.repository";
import { IUserCourseProgressRepository } from "../interfaces/courseProgress.repository";
import { ITransactionService } from "../interfaces/transaction.service";
import { ITransaction } from "../models/transaction.model";
import { NotificationService } from "./notification.service";
import { IAuthService } from "../interfaces/auth.service";

@injectable()
export class TransactionService implements ITransactionService {
  constructor(
    @inject(TYPES.ITransactionRepository) private transactionRepository: ITransactionRepository,
    @inject(TYPES.ICourseRepository) private courseRepository: ICourseRepository,
    @inject(TYPES.IUserCourseProgressRepository) private userCourseProgressRepository: IUserCourseProgressRepository,
    @inject(TYPES.IAuthService) private authService: IAuthService,
    private notificationService: NotificationService
  ) {}

  async listTransactions(userId?: string): Promise<ITransaction[]> {
    return userId ? this.transactionRepository.findByUserId(userId) : this.transactionRepository.findAll();
  }

  async createTransaction(
    userId: string,
    courseId: string,
    transactionId: string,
    amount: number,
    paymentProvider: "stripe"
  ): Promise<ITransaction> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new Error("Course not found");

    const user = await this.authService.findUserById(userId);
    if (!user) throw new Error("User not found");

    const transactionData = {
      userId,
      transactionId,
      dateTime: new Date().toISOString(),
      courseId,
      amount,
      paymentProvider,
    };
    const savedTransaction = await this.transactionRepository.create(transactionData);

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
    await this.userCourseProgressRepository.saveUserCourseProgress(initialProgress);

    await this.courseRepository.addEnrollment(courseId, userId);

    // Send notification to course teacher
    await this.notificationService.createNotification({
      userId: course.teacherId,
      title: "New Enrollment",
      message: `${user.name} has enrolled in your course "${course.title}"`,
      type: "success",
      link: `/teacher/courses/${course.courseId}/students`,
    });

    return savedTransaction;
  }
}