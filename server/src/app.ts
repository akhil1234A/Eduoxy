import express from "express";
import cors from "cors";

import { errorHandler } from "./middleware/errorHandler";
import courseRoutes from "./routes/courseRoutes";
import authRoutes from './routes/auth.routes';


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/api",(req,res)=>{
  res.send('API TEST')
})
app.use('/api/auth', authRoutes);
app.use("/api/courses", courseRoutes);


// Error Handling Middleware
app.use(errorHandler);

export default app;
