import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import useragent from "useragent";
import geoip from "geoip-lite";

export const logRequests = (req: Request, res: Response, next: NextFunction) => {
  const { method, url, headers, ip, body, query, params } = req;

  const ipAddress = ip || "0.0.0.0";
  const userId = req.cookies?.userId || "unknown";
  const userType = req.cookies?.userType || "guest";

  const agent = useragent.parse(headers["user-agent"] || "");
  const geo = geoip.lookup(ipAddress);
  const location = geo ? `${geo.city || "Unknown"}, ${geo.country || "Unknown"}` : "Unknown";

  // Sanitize the body (avoid logging passwords, etc.)
  const sanitizedBody = { ...body };
  if (sanitizedBody.password) {
    sanitizedBody.password = "***";
  }
  if (sanitizedBody.confirmPassword) {
    sanitizedBody.confirmPassword = "***";
  }

  logger.info({
    message: "API Request",
    method,
    url,
    user: { id: userId, role: userType },
    ip: ipAddress,
    device: agent.toString(),
    location,
    timestamp: new Date().toISOString(),
    query: query,  
    params: params, 
    body: sanitizedBody, 
  });

  next();
};
