import { injectable, inject } from "inversify";
import { format } from "date-fns";
import { s3Service } from "../services/s3.service";
import { ICertificate } from "../models/certificate.model";
import { CertificateResponse, ForumResponse, UserResponse} from "../types/dtos";
import { IForum } from "../interfaces/forum.model";
import { apiLogger } from "../utils/logger";
import { IUser } from "../models/user.model";

@injectable()
export class MapperUtil {
  constructor() {}

  // Certificate Mapping
  async toCertificateResponse(
    certificate: ICertificate,
  ): Promise<CertificateResponse> {
    const key = s3Service.extractKeyFromUrl(certificate.certificateUrl);
    let presignedUrl: string | null = null;
    try {
      presignedUrl = key ? await s3Service.generateDownloadPresignedUrl(key, 300) : null;
    } catch (error) {
      apiLogger.error(`Failed to generate presigned URL for certificate ${certificate.certificateId}`, error);
    }

    const response: CertificateResponse = {
      id: certificate._id?.toString() || certificate.certificateId,
      certificateId: certificate.certificateId, 
      courseId: certificate.courseId,
      courseName: certificate.courseName,
      certificateUrl: presignedUrl || certificate.certificateUrl,
      issuedAt: format(new Date(certificate.issuedAt), "yyyy-MM-dd"),
    };

   

    return response;
  }

  async toCertificateResponseArray(
    certificates: ICertificate[],
  ): Promise<CertificateResponse[]> {
    return Promise.all(
      certificates.map((cert) => this.toCertificateResponse(cert))
    );
  }


  async toForumResponse(
    forum: IForum,
  ): Promise<ForumResponse> {
    
    const response: ForumResponse = {
      _id: forum._id.toString(),
      title: forum.title,
      description: forum.description
    };

    return response;
  }

   async toForumResponseArray(
    forum: IForum[],
  ): Promise<ForumResponse[]> {
    return Promise.all(
      forum.map((forum) => this.toForumResponse(forum))
    );
  }

   async toProfileResponse(
    profile: IUser,
  ): Promise<UserResponse> {
    
    const response: UserResponse = {
      _id: profile.id.toString(),
      name: profile.name,
      email: profile.email,
      userType: profile.userType,
      title: profile.title,
      bio: profile.bio,
      profileImage: profile.profileImage,
    };

    return response;
  }

}