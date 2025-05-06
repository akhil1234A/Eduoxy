import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import TYPES from "../di/types";
import { ICertificateService } from "../interfaces/certificate.service";
import { HttpStatus } from "../utils/httpStatus";
import { successResponse, errorResponse } from "../types/types";
import { RESPONSE_MESSAGES } from "../utils/responseMessages";
import { apiLogger } from "../utils/logger";

@injectable()
export class CertificateController {
  constructor(
    @inject(TYPES.ICertificateService) private _certificateService: ICertificateService
  ) {}

  async generateCertificate(req: Request, res: Response): Promise<void> {
    try {
      const { userId, courseId, courseName } = req.body;
      const certificate = await this._certificateService.generateCertificate(userId, courseId, courseName);
      apiLogger.info("Certificate generated", { certificateId: certificate.certificateId });
      res.status(HttpStatus.CREATED).json(successResponse(RESPONSE_MESSAGES.CERTIFICATE.GENERATED_SUCCESS, certificate));
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Certificate generation failed", { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.CERTIFICATE.GENERATED_ERROR, err.message));
    }
  }

  async getUserCertificates(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = "1", limit = "10" } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const { certificates, total } = await this._certificateService.getUserCertificates(userId, pageNum, limitNum);
      res.status(HttpStatus.OK).json(
        successResponse(RESPONSE_MESSAGES.CERTIFICATE.RETRIEVE_SUCCESS, {
          certificates,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        })
      );
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Failed to retrieve user certificates", { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.CERTIFICATE.RETRIEVE_ERROR, err.message));
    }
  }

  async getCertificateById(req: Request, res: Response): Promise<void> {
    try {
      const { certificateId } = req.params;
      const certificate = await this._certificateService.getCertificateById(certificateId);
      if (!certificate) {
        res.status(HttpStatus.NOT_FOUND).json(errorResponse(RESPONSE_MESSAGES.CERTIFICATE.NOT_FOUND));
        return;
      }
      res.status(HttpStatus.OK).json(successResponse(RESPONSE_MESSAGES.CERTIFICATE.RETRIEVE_SUCCESS, certificate));
    } catch (error) {
      const err = error as Error;
      apiLogger.error("Failed to retrieve certificate", { error: err.message });
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorResponse(RESPONSE_MESSAGES.CERTIFICATE.RETRIEVE_ERROR, err.message));
    }
  }
}