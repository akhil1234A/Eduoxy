import dotenv from "dotenv";
import { connectDB } from "./config/database";
import redisClient from "./config/redis"; // Import Redis client
import app from "./app";


// Load environment variables
dotenv.config();

async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Ensure Redis is connected
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Server Startup Failed:', err);
    process.exit(1);
  }
}

startServer();