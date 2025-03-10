import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import useragent from "useragent";
import geoip from "geoip-lite";

export const logRequests = (req: Request, res: Response, next: NextFunction) => {
  const { method, url, headers, ip } = req;

  const ipAddress = ip || "0.0.0.0";

  const userId = req.cookies?.userId || "unknown"; 
  const userType = req.cookies?.userType || "guest";

  const agent = useragent.parse(headers["user-agent"] || "");

  // Get location safely
  const geo = geoip.lookup(ipAddress);
  const location = geo ? `${geo.city || "Unknown"}, ${geo.country || "Unknown"}` : "Unknown";

  logger.info({
    message: "API Request",
    method,
    url,
    user: { id: userId, role: userType },
    ip: ipAddress,
    device: agent.toString(),
    location,
    timestamp: new Date().toISOString(),
  });

  next();
};
