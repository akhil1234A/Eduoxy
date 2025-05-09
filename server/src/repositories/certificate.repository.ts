import { injectable } from "inversify";
import { Certificate, ICertificate } from "../models/certificate.model";
import { ICertificateRepository } from "../interfaces/certificate.repository";
import { BaseRepository } from "./base.repository";


/**
 * CertificateRepository class is responsible for interacting with the Certificate model.
 * It provides methods to create, find, and manage certificates in the database.
 */
@injectable()
export class CertificateRepository extends BaseRepository<ICertificate> implements ICertificateRepository {

  /**``````
   * Creates a new certificate in the database.
   * @param {Partial<ICertificate>} certificate - The certificate data to be created.
   * @returns {Promise<ICertificate>} - The created certificate.
   */
  async createCertificate(certificate: Partial<ICertificate>): Promise<ICertificate> {
    return await Certificate.create(certificate);
  }

  /**
   * Finds a list of certificates of a user 
   * @param {string} userId - The ID of the certificate to find.
   * @returns {Promise<ICertificate | null>} - The found certificate or null if not found.
   */
  async findByUserId(userId: string, page: number, limit: number): Promise<{ certificates: ICertificate[]; total: number }> {
    const skip = (page - 1) * limit;
    const [certificates, total] = await Promise.all([
      Certificate.find({ userId }).skip(skip).limit(limit).lean(),
      Certificate.countDocuments({ userId }),
    ]);
    return { certificates, total };
  }

  /**
   * Finds a certificate by its ID.
   * @param {string} certificateId - The ID of the certificate to find.
   * @returns {Promise<ICertificate | null>} - The found certificate or null if not found.
   */
  async findByCertificateId(certificateId: string): Promise<ICertificate | null> {
    return await Certificate.findOne({ certificateId }).lean();
  }

  /**
   * Finds a certificate by its user ID and course ID.
   * Prevents duplicate certificates for the same course.
   * @param {string} userId - The ID of the user.
   * @param {string} courseId - The ID of the course.
   * @returns {Promise<ICertificate | null>} - The found certificate or null if not found.
   */
  async findByUserIdAndCourseId(userId: string, courseId: string): Promise<ICertificate | null> {
    return await Certificate.findOne({ userId, courseId }).lean();
  }

}