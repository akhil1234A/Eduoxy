import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../services/auth.service";
import { AuthController } from "../controllers/auth.controller";
import { AdminService } from "../services/admin.service";
import { AdminController } from "../controllers/admin.controller";
import redisClient from "../config/redis";
import { CourseService } from "../services/course.service";
import { CourseController } from '../controllers/course.controller'
import { CourseRepository } from "../repositories/course.repository";
import { MailService } from "../utils/mail";
import { JwtService } from "../utils/jwt";
import Course from "../models/course.model";

// Repositories
const userRepository = new UserRepository();
const courseRepository = new CourseRepository(Course);

// Services
const mailService = new MailService();
const jwtService = new JwtService();

const authService = new AuthService(userRepository, redisClient, mailService, jwtService);
const adminService = new AdminService(userRepository);
const courseService = new CourseService(courseRepository)

// Controllers
const authController = new AuthController(authService);
const adminController = new AdminController(adminService);
const courseController = new CourseController(courseService)

export { authController, adminController, courseController };