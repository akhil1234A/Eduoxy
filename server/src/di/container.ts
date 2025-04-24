import { Container } from "inversify";
import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../services/auth.service";
import { AuthController } from "../controllers/auth.controller";
import { AdminService } from "../services/admin.service";
import { AdminController } from "../controllers/admin.controller";
import redisClient from "../config/redis";
import { CourseService } from "../services/course.service";
import { CourseController } from "../controllers/course.controller";
import { CourseRepository } from "../repositories/course.repository";
import { MailService } from "../utils/mail";
import { JwtService } from "../utils/jwt";
import Course, { ICourseDocument } from "../models/course.model";
import TYPES from "./types";
import { Model } from "mongoose";

import { IUserRepository } from "../interfaces/user.repository";
import { IAuthService } from "../interfaces/auth.service";
import { IAdminService } from "../interfaces/admin.service";
import { ICourseService } from "../interfaces/course.service";
import { ICourseRepository } from "../interfaces/course.repository";
import { IMailService } from "../utils/mail";
import { IJwtService } from "../utils/jwt";
import { IRedisClient } from "../config/redis";
import User from "../models/user.model";

import { UserCourseProgressRepository } from "../repositories/courseProgress.repository";
import { IUserCourseProgressRepository } from "../interfaces/courseProgress.repository";
import { UserCourseProgressService } from "../services/userProgress.service";
import { IUserCourseProgressService } from "../interfaces/courseProgress.service";
import { UserCourseProgress } from "../models/userCourseProgress.model";
import { UserCourseProgressController } from "../controllers/courseProgress.controller";
import Transaction, { ITransaction } from "../models/transaction.model";
import { TransactionRepository } from "../repositories/transaction.repository";
import { ITransactionRepository } from "../interfaces/transaction.repository";
import { TransactionService } from "../services/transaction.service";
import { ITransactionService } from "../interfaces/transaction.service";
import { TransactionController } from "../controllers/transaction.controller";
import { NotificationService } from "../services/notification.service";
import { IUserService } from "../interfaces/user.service";
import { UserService } from "../services/user.service";
import { UserController } from "../controllers/user.controller";
import { IDashboardService } from "../interfaces/dashboard.service";
import { DashboardService } from "../services/dashboard.service";
import { DashboardController } from "../controllers/dashboard.controller";
import { ChatService } from "../services/chat.service";
import { IChatService } from "../interfaces/chat.service";
import { ChatController } from "../controllers/chat.controller";
import { IMessage } from "../models/chat.model";
import Message from "../models/chat.model";
import { ChatRepository } from "../repositories/chat.repository";
import { IChatRepository } from "../interfaces/chat.repository";
import { LiveClassRepository } from "../repositories/liveClass.repository";
import { ILiveClassRepository } from "../interfaces/liveClass.repository";
import { LiveClassService } from "../services/liveClass.service";
import { ILiveClassService } from "../interfaces/liveClass.service";
import { LiveClassController } from "../controllers/liveClass.controller";
import LiveClass, { ILiveClass } from "../models/liveClass.model";
import { ForumRepository } from "../repositories/forum.repository";
import { IForumRepository } from "../interfaces/forum.repository";
import { ForumService } from "../services/forum.service";
import { IForumService } from "../interfaces/forum.service";


import { RoadmapRepository } from "../repositories/roadmap.repository";
import { IRoadmapRepository } from "../interfaces/roadmap.repository";
import { RoadmapService } from "../services/roadmap.service";
import { RoadmapController } from "../controllers/roadmap.controller";
import { IRoadmapService } from "../interfaces/roadmap.service";
import Roadmap, { IRoadmapDocument } from "../models/roadmap.model";

import { Review } from "../models/review.model";
import { ReviewRepository } from "../repositories/review.repository";
import { ReviewController } from "../controllers/review.controller";
import { IReviewDocument } from "../interfaces/review.interface";
import { ReviewService } from "../services/review.service";
import { IReviewService } from "../interfaces/review.service";
import { IReviewRepository } from "../interfaces/review.repository";
import { ForumController } from "../controllers/forum.controller";

const container = new Container();

// Repositories
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository).inSingletonScope();
container.bind<ICourseRepository>(TYPES.ICourseRepository).to(CourseRepository).inSingletonScope();
container.bind<IUserCourseProgressRepository>(TYPES.IUserCourseProgressRepository).to(UserCourseProgressRepository).inSingletonScope();
container.bind<ITransactionRepository>(TYPES.ITransactionRepository).to(TransactionRepository).inSingletonScope();
container.bind<IChatRepository>(TYPES.IChatRepository).to(ChatRepository).inSingletonScope();
container.bind<ILiveClassRepository>(TYPES.ILiveClassRepository).to(LiveClassRepository).inSingletonScope();
container.bind<IForumRepository>(TYPES.IForumRepository).to(ForumRepository).inSingletonScope();
container.bind<IRoadmapRepository>(TYPES.IRoadmapRepository).to(RoadmapRepository).inSingletonScope();
container.bind<IReviewRepository>(TYPES.IReviewRepository).to(ReviewRepository).inSingletonScope();

// Model
container.bind<typeof User>(TYPES.UserModel).toConstantValue(User)
container.bind<Model<ICourseDocument>>(TYPES.CourseModel).toConstantValue(Course);
container.bind<typeof UserCourseProgress>(TYPES.UserCourseProgressModel).toConstantValue(UserCourseProgress);
container.bind<typeof Transaction>(TYPES.TransactionModel).toConstantValue(Transaction);
container.bind<Model<IMessage>>(TYPES.MessageModel).toConstantValue(Message);
container.bind<Model<ILiveClass>>(TYPES.LiveClassModel).toConstantValue(LiveClass);
container.bind<Model<IRoadmapDocument>>(TYPES.RoadmapModel).toConstantValue(Roadmap);
container.bind<Model<IReviewDocument>>(TYPES.ReviewModel).toConstantValue(Review);

// Utilities
container.bind<IMailService>(TYPES.IMailService).to(MailService).inSingletonScope();
container.bind<IJwtService>(TYPES.IJwtService).to(JwtService).inSingletonScope();
container.bind<IRedisClient>(TYPES.IRedisClient).toConstantValue(redisClient);

// Services
container.bind<IAuthService>(TYPES.IAuthService).to(AuthService).inSingletonScope();
container.bind<IAdminService>(TYPES.IAdminService).to(AdminService).inSingletonScope();
container.bind<ICourseService>(TYPES.ICourseService).to(CourseService).inSingletonScope();
container.bind<IUserCourseProgressService>(TYPES.IUserCourseProgressService).to(UserCourseProgressService).inSingletonScope();
container.bind<ITransactionService>(TYPES.ITransactionService).to(TransactionService).inSingletonScope();
container.bind<NotificationService>(NotificationService).toSelf();
container.bind<IUserService>(TYPES.IUserService).to(UserService).inSingletonScope();
container.bind<IDashboardService>(TYPES.IDashboardService).to(DashboardService).inSingletonScope();
container.bind<IChatService>(TYPES.IChatService).to(ChatService).inSingletonScope();
container.bind<ILiveClassService>(TYPES.ILiveClassService).to(LiveClassService).inSingletonScope();
container.bind<IReviewService>(TYPES.IReviewService).to(ReviewService).inSingletonScope();
container.bind<ReviewService>(TYPES.ReviewService).to(ReviewService).inSingletonScope();

container.bind<IForumService>(TYPES.IForumService).toDynamicValue(() => {
  return new ForumService(
    container.get<IForumRepository>(TYPES.IForumRepository),
    container.get<IUserService>(TYPES.IUserService)
  );
}).inSingletonScope();
container.bind<IRoadmapService>(TYPES.IRoadmapService).to(RoadmapService).inSingletonScope();

// Controllers
container.bind<AuthController>(TYPES.IAuthController).to(AuthController).inSingletonScope();
container.bind<AdminController>(TYPES.IAdminController).to(AdminController).inSingletonScope();
container.bind<CourseController>(TYPES.ICourseController).to(CourseController).inSingletonScope();
container.bind<UserCourseProgressController>(TYPES.IUserCourseProgressController).to(UserCourseProgressController).inSingletonScope();
container.bind<TransactionController>(TYPES.ITransactionController).to(TransactionController).inSingletonScope();
container.bind<UserController>(TYPES.IUserController).to(UserController).inSingletonScope();
container.bind<DashboardController>(TYPES.IDashboardController).to(DashboardController).inSingletonScope();
container.bind<ChatController>(TYPES.IChatController).to(ChatController).inSingletonScope();
container.bind<LiveClassController>(TYPES.ILiveClassController).to(LiveClassController).inSingletonScope();
container.bind<RoadmapController>(TYPES.IRoadmapController).to(RoadmapController).inSingletonScope();
container.bind<ReviewController>(TYPES.ReviewController).to(ReviewController);
container.bind<ForumController>(TYPES.IForumController).to(ForumController).inSingletonScope();



export const authController = container.get<AuthController>(TYPES.IAuthController);
export const adminController = container.get<AdminController>(TYPES.IAdminController);
export const courseController = container.get<CourseController>(TYPES.ICourseController);
export const userCourseProgressController = container.get<UserCourseProgressController>(TYPES.IUserCourseProgressController);
export const transactionController = container.get<TransactionController>(TYPES.ITransactionController);
export const userController = container.get<UserController>(TYPES.IUserController);
export const dashboardController = container.get<DashboardController>(TYPES.IDashboardController);
export const chatController = container.get<ChatController>(TYPES.IChatController);
export const liveClassController = container.get<LiveClassController>(TYPES.ILiveClassController);
export const roadmapController = container.get<RoadmapController>(TYPES.IRoadmapController);
export const reviewController = container.get<ReviewController>(TYPES.ReviewController);
export const forumController = container.get<ForumController>(TYPES.IForumController);

export default container;
