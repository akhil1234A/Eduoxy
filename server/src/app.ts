import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser'
import http from 'http';
import { initializeSocket } from "./socket";
import { initializeWebSocket } from "./utils/socketLogger";

import { errorHandler } from "./middleware/errorHandler";
import { logRequests } from "./utils/logRequests";
import { logErrors } from "./middleware/logError";

import courseRoutes from "./routes/courseRoutes";
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import courseProgressRoutes from './routes/courseProgress.routes'
import transactionRoutes from "./routes/transaction.routes";
import notificationRoutes from "./routes/notification.routes";

const app = express();
const server = http.createServer(app);

// Initialize both Socket.IO and WebSocket
export const io = initializeSocket(server);
export const ws = initializeWebSocket(server);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(logRequests);

// API Routes
app.get("/api",(req,res)=>{
  res.send('API TEST')
})
app.use('/api/auth', authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users/course-progress",courseProgressRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/notifications", notificationRoutes);

// Error Handling Middleware
app.use(logErrors);
app.use(errorHandler);

export { app, server };
