import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser'

import { errorHandler } from "./middleware/errorHandler";
import { logRequests } from "./utils/logRequests";
import { logErrors } from "./middleware/logError";

import courseRoutes from "./routes/courseRoutes";
import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';


const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));


app.use(logRequests)

//API 
app.get("/api",(req,res)=>{
  res.send('API TEST')
})
app.use('/api/auth', authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);

// Error Handling Middleware
app.use(logErrors);
app.use(errorHandler);

export default app;
