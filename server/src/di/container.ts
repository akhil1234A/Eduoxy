import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../services/auth.service";
import { AuthController } from "../controllers/auth.controller";
import { AdminService } from "../services/admin.service";
import { AdminController } from "../controllers/admin.controller";
import redisClient from "../config/redis";
import { MailService } from "../utils/mail";
import { JwtService } from "../utils/jwt";

// Repositories
const userRepository = new UserRepository();

// Services
const mailService = new MailService();
const jwtService = new JwtService();

const authService = new AuthService(userRepository, redisClient, mailService, jwtService);
const adminService = new AdminService(userRepository);

// Controllers
const authController = new AuthController(authService);
const adminController = new AdminController(adminService);

export { authController, adminController };