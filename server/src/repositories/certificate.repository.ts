import { injectable } from "inversify";
import { Certificate, ICertificate } from "../models/certificate.model";
import { ICertificateRepository } from "../interfaces/certificate.repository";



@injectable()
export class CertificateRepository implements ICertificateRepository {
  async create(certificate: Partial<ICertificate>): Promise<ICertificate> {
    return await Certificate.create(certificate);
  }

  async findByUserId(userId: string, page: number, limit: number): Promise<{ certificates: ICertificate[]; total: number }> {
    const skip = (page - 1) * limit;
    const [certificates, total] = await Promise.all([
      Certificate.find({ userId }).skip(skip).limit(limit).lean(),
      Certificate.countDocuments({ userId }),
    ]);
    return { certificates, total };
  }

  async findByCertificateId(certificateId: string): Promise<ICertificate | null> {
    return await Certificate.findOne({ certificateId }).lean();
  }
}