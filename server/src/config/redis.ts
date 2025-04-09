import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";

dotenv.config();

export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { EX: number }): Promise<string | null>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  isOpen: boolean;
  connect(): Promise<void>;
  
  // Set operations
  sAdd(key: string, member: string): Promise<number>;
  sRem(key: string, member: string): Promise<number>;
  sMembers(key: string): Promise<string[]>;
  sIsMember(key: string, member: string): Promise<boolean>;
}

const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Error:", err));
redisClient.on("connect", () => console.log("Redis Connected"));
redisClient.on("reconnecting", () => console.log("Redis Reconnecting"));
redisClient.on("end", () => console.log("Redis Disconnected"));

async function ensureRedisConnection() {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log("Redis connection established");
    } catch (err) {
      console.error("Redis Connection Failed:", err);
      throw err;
    }
  }
}

ensureRedisConnection().catch((err) => {
  console.error("Initial Redis connection failed:", err);
});

// Wrap or cast to match IRedisClient
const redisClientWrapper: IRedisClient = {
  get: redisClient.get.bind(redisClient),
  set: redisClient.set.bind(redisClient),
  del: redisClient.del.bind(redisClient),
  keys: redisClient.keys.bind(redisClient),
  isOpen: redisClient.isOpen,
  connect: async () => {
    await redisClient.connect();
  },
  // Set operations
  sAdd: redisClient.sAdd.bind(redisClient),
  sRem: redisClient.sRem.bind(redisClient),
  sMembers: redisClient.sMembers.bind(redisClient),
  sIsMember: redisClient.sIsMember.bind(redisClient),
};

export default redisClientWrapper;