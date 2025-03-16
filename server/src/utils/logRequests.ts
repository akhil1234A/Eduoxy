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
  const userName = req.cookies?.userName || "unknown";
  const sessionId = req.cookies?.sessionId || "unknown"; 

  const agent = useragent.parse(headers["user-agent"] || "");
  const geo = geoip.lookup(ipAddress);
  const location = geo ? `${geo.city || "Unknown"}, ${geo.country || "Unknown"}` : "Unknown";

  // Sanitize request body
  const sanitizedBody = { ...body };
  ["password", "confirmPassword", "idToken", "accessToken", "refreshToken"].forEach((key) => {
    if (sanitizedBody[key]) sanitizedBody[key] = "***";
  });

  let oldSend = res.send;
  let responseBody: any = null;
  let responseSize: number | null = null;

  res.send = function (data) {
    responseBody = data;
    responseSize = Buffer.byteLength(JSON.stringify(data), "utf-8"); 
    return oldSend.apply(res, arguments as any);
  };

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    logger.info({
      message: "API Request",
      method,
      url,
      fullUrl: `${req.protocol}://${req.get("host")}${req.originalUrl}`, 
      user: { id: userId, role: userType, name: userName, sessionId },
      ip: ipAddress,
      proxyChain: headers["x-forwarded-for"] || "Direct Connection",
      device: agent.toString(),
      location,
      status: res.statusCode,
      responseTime: `${duration}ms`,
      headers: {
        host: headers.host,
        contentType: headers["content-type"],
        userAgent: headers["user-agent"],
        referer: headers.referer || "Unknown", 
        origin: headers.origin || "Unknown",
      },
      responseHeaders: res.getHeaders(), 
      timestamp: new Date().toISOString(),
      query,
      params,
      body: sanitizedBody,
      response: responseBody, 
      responseSize: responseSize ? `${responseSize} bytes` : "Unknown",
    });
  });

  next();
};
