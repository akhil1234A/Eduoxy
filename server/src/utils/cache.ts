import redisClientWrapper from "../config/redis";

// 1 HR TTL
const CACHE_TTL = 3600;

export class CacheUtil {
  static getCourseCacheKey(courseId: string): string {
    return `course:${courseId}`;
  }

  static getCoursesListCacheKey(type: string, filter: string = "all"): string {
    return `courses:${type}:${filter}`;
  }

  static async get<T>(key: string): Promise<T | null> {
    const data = await redisClientWrapper.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async set<T>(key: string, value: T, ttl: number = CACHE_TTL): Promise<void> {
    await redisClientWrapper.set(key, JSON.stringify(value), { EX: ttl });
  }

  static async del(key: string): Promise<void> {
    await redisClientWrapper.del(key);
  }

  static async invalidateCourseListCaches(): Promise<void> {
    const keys = await redisClientWrapper.keys("courses:*");
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redisClientWrapper.del(key)));
    }
  }
}