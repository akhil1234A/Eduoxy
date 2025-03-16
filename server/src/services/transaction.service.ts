import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ITransactionRepository } from "../interfaces/transaction.repository";
import { ICourseRepository } from "../interfaces/course.repository";
import { IUserCourseProgressRepository } from "../interfaces/courseProgress.repository";
import { ITransactionService } from "../interfaces/transaction.service";
import { ITransaction } from "../models/transaction.model";

@injectable()
export class TransactionService implements ITransactionService {
  constructor(
    @inject(TYPES.ITransactionRepository) private transactionRepository: ITransactionRepository,
    @inject(TYPES.ICourseRepository) private courseRepository: ICourseRepository,
    @inject(TYPES.IUserCourseProgressRepository) private userCourseProgressRepository: IUserCourseProgressRepository
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

    return savedTransaction;
  }
}