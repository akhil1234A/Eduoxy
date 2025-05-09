import { injectable, inject } from "inversify";
import TYPES from "../di/types";
import { ICertificateRepository } from "../interfaces/certificate.repository";
import { ICertificate } from "../models/certificate.model";
import { s3Service } from "./s3.service";
import PDFDocument from "pdfkit";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { ICertificateService } from "../interfaces/certificate.service";
import { IUserService } from "../interfaces/user.service";
import { UserCourseProgressRepository } from "../repositories/courseProgress.repository";
import { SERVICE_MESSAGES } from "../utils/serviceMessages";


/**
 * This is a service responsible for managing certificates
 * 
 */
@injectable()
export class CertificateService implements ICertificateService {
  constructor(
    @inject(TYPES.ICertificateRepository) private _certificateRepository: ICertificateRepository,
    @inject(TYPES.IUserService) private _userService: IUserService,
    @inject(TYPES.IUserCourseProgressRepository) private _userCourseProgressRepository: UserCourseProgressRepository,
  ) {}

  /**
   * This method generates a certificate for a user who has completed a course
   * @param userId 
   * @param courseId 
   * @param courseName 
   * @returns 
   */
  async generateCertificate(userId: string, courseId: string, courseName: string): Promise<ICertificate> {
    
    const isCompleted = await this._userCourseProgressRepository.isCourseCompleted(userId, courseId);

    if (!isCompleted) {
      throw new Error(SERVICE_MESSAGES.COURSE_NOT_COMPLETED);
    }

    const existingCertificate = await this._certificateRepository.findByUserIdAndCourseId(userId, courseId);
    if (existingCertificate) {
      throw new Error(SERVICE_MESSAGES.CERTIFICATE_ALREADY_EXISTS);
    }
    
    const certificateId = `EDUOXY-${format(new Date(), "yyyyMMdd")}-${uuidv4().slice(0, 6).toUpperCase()}`;
    const fileName = `${certificateId}.pdf`;
    const getUserInfo = await this._userService.getProfile(userId);
    
    if (!getUserInfo) {
      throw new Error(SERVICE_MESSAGES.USER_NOT_FOUND);
    }
    
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      info: { Title: `Certificate of Completion - ${courseName}` },
    });
    const buffers: Buffer[] = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {});

    doc.fontSize(36).text("Certificate of Completion", { align: "center" });
    doc.moveDown();
    doc.fontSize(24).text(`This certifies that`, { align: "center" });
    doc.moveDown();
    doc.fontSize(30).text(`${getUserInfo.name}`, { align: "center" }); 
    doc.moveDown();
    doc.fontSize(20).text(`has successfully completed the course`, { align: "center" });
    doc.moveDown();
    doc.fontSize(28).text(courseName, { align: "center" });
    doc.moveDown(2);
    doc.fontSize(16).text(`Issued on ${format(new Date(), "MMMM d, yyyy")}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Certificate ID: ${certificateId}`, { align: "center" });
    doc.end();

    const pdfBuffer = Buffer.concat(await new Promise<Buffer[]>((resolve) => doc.on("end", () => resolve(buffers))));

    
    const { publicUrl } = await s3Service.uploadFile(
        pdfBuffer,
        fileName,
        "application/pdf",
        "certificates",
    )


    const certificate: Partial<ICertificate> = {
      userId,
      courseId,
      courseName,
      certificateUrl: publicUrl,
      issuedAt: new Date(),
      certificateId,
    };

    return await this._certificateRepository.createCertificate(certificate);
  }

  /**
   * This method retrieves a list of certificates for a user
   * @param userId 
   * @param page 
   * @param limit 
   * @returns 
   */
  async getUserCertificates(userId: string, page: number, limit: number): Promise<{ certificates: ICertificate[]; total: number }> {
    return await this._certificateRepository.findByUserId(userId, page, limit);
  }

  /**
   * This method retrieves a certificate by its ID
   * @param certificateId 
   * @returns 
   */
  async getCertificateById(certificateId: string): Promise<ICertificate | null> {
    return await this._certificateRepository.findByCertificateId(certificateId);
  }
}