import express from "express";
import cors from "cors";
// import courseRoutes from "./presentation/CourseRoutes";
import { errorHandler } from "./presentation/middleware/errorHandler";
import {
  clerkMiddleware,
  createClerkClient,
  requireAuth,
} from "@clerk/express";
import courseRoutes from "./presentation/routes/courseRoutes";

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

app.get("/",(req,res)=>{
  res.send('API TEST')
})

app.use("/api/courses", courseRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
