import { ICertificate } from "../models/certificate.model";

export interface ICertificateService {
  generateCertificate(userId: string, courseId: string, courseName: string): Promise<ICertificate>;
  getUserCertificates(userId: string, page: number, limit: number): Promise<{ certificates: ICertificate[]; total: number }>;
  getCertificateById(certificateId: string): Promise<ICertificate | null>;
}