import { Certificate, ICertificate } from "../models/certificate.model";

export interface ICertificateRepository {
  create(certificate: Partial<ICertificate>): Promise<ICertificate>;
  findByUserId(userId: string, page: number, limit: number): Promise<{ certificates: ICertificate[]; total: number }>;
  findByCertificateId(certificateId: string): Promise<ICertificate | null>;
  findByUserIdAndCourseId(userId: string, courseId: string): Promise<ICertificate | null>;
}