import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import useragent from "useragent";
import geoip from "geoip-lite";

export const logRequests = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now(); 
  const { method, url, headers, ip, body, query, params } = req;

  const ipAddress = ip || "0.0.0.0"; 
  const userId = req.cookies?.userId || "unknown";
  const userType = req.cookies?.userType || "guest";
  const userName = req.cookies?.userName || 'unkown';

  const agent = useragent.parse(headers["user-agent"] || "");
  const geo = geoip.lookup(ipAddress);
  const location = geo ? `${geo.city || "Unknown"}, ${geo.country || "Unknown"}` : "Unknown";

  
  const sanitizedBody = { ...body };
  if (sanitizedBody.password) sanitizedBody.password = "***";
  if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = "***";
  if (sanitizedBody.idToken) sanitizedBody.idToken = "***"; 

  
  res.on("finish", () => {
    const duration = Date.now() - startTime; 

    logger.info({
      message: "API Request",
      method,
      url,
      user: { id: userId, role: userType, name: userName },
      ip: ipAddress,
      device: agent.toString(),
      location,
      status: res.statusCode, 
      responseTime: `${duration}ms`, 
      headers: {
        host: headers.host,
        contentType: headers["content-type"],
        userAgent: headers["user-agent"],
      },
      timestamp: new Date().toISOString(),
      query,
      params,
      body: sanitizedBody,
    });
  });

  next();
};
