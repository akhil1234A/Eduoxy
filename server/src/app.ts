import express from "express";
import cors from "cors";
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import { errorHandler } from "./middleware/errorHandler";
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

app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));


//API 
app.get("/api",(req,res)=>{
  res.send('API TEST')
})
app.use('/api/auth', authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
