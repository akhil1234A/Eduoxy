import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Error:', err));
redisClient.on('connect', () => console.log('Redis Connected'));
redisClient.on('reconnecting', () => console.log('Redis Reconnecting'));
redisClient.on('end', () => console.log('Redis Disconnected'));

// Connect and handle reconnection
async function ensureRedisConnection() {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (err) {
      console.error('Redis Connection Failed:', err);
    }
  }
}

// Initial connection
ensureRedisConnection();

export default redisClient;