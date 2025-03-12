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

const container = new Container();

// Repositories
container.bind<IUserRepository>(TYPES.IUserRepository).to(UserRepository).inSingletonScope();
container.bind<ICourseRepository>(TYPES.ICourseRepository).to(CourseRepository).inSingletonScope();

// Model
container.bind<typeof User>(TYPES.UserModel).toConstantValue(User)
container.bind<Model<ICourseDocument>>(TYPES.CourseModel).toConstantValue(Course);

// Utilities
container.bind<IMailService>(TYPES.IMailService).to(MailService).inSingletonScope();
container.bind<IJwtService>(TYPES.IJwtService).to(JwtService).inSingletonScope();
container.bind<IRedisClient>(TYPES.IRedisClient).toConstantValue(redisClient);

// Services
container.bind<IAuthService>(TYPES.IAuthService).to(AuthService).inSingletonScope();
container.bind<IAdminService>(TYPES.IAdminService).to(AdminService).inSingletonScope();
container.bind<ICourseService>(TYPES.ICourseService).to(CourseService).inSingletonScope();

// Controllers
container.bind<AuthController>(TYPES.IAuthController).to(AuthController).inSingletonScope();
container.bind<AdminController>(TYPES.IAdminController).to(AdminController).inSingletonScope();
container.bind<CourseController>(TYPES.ICourseController).to(CourseController).inSingletonScope();


export const authController = container.get<AuthController>(TYPES.IAuthController);
export const adminController = container.get<AdminController>(TYPES.IAdminController);
export const courseController = container.get<CourseController>(TYPES.ICourseController);

export default container;
