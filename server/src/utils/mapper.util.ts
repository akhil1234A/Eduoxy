import { injectable, inject } from "inversify";
import { format } from "date-fns";
import { s3Service } from "../services/s3.service";
import { ICertificate } from "../models/certificate.model";
import { ICourse } from "../models/course.model";
import { ITransaction } from "../models/transaction.model";
import { CertificateResponse, ForumResponse, listUsers, UserResponse, CourseResponse, EnrollmentResponse} from "../types/dtos";
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

  async toUserResponse(profile: IUser): Promise<listUsers> {
    return {
      _id: profile.id.toString(),
      name: profile.name,
      email: profile.email,
      userType: profile.userType,
      isVerified: profile.isVerified,
      isBlocked: profile.isBlocked,
    };
  }

  async toListUsersResponseArray(users: IUser[]): Promise<listUsers[]> {
    return Promise.all(users.map((user) => this.toUserResponse(user)));
  }

  async toCourseResponse(course: ICourse): Promise<CourseResponse> {
    let instructor: Pick<UserResponse, '_id' | 'name' | 'title'>;
   

    return {
      _id: course.courseId,
      instructor: course.teacherName,
      title: course.title,
      description: course.description || "",
      createdAt: course.createdAt,

    };
  }

  async toCourseResponseArray(courses: ICourse[]): Promise<CourseResponse[]> {
    return Promise.all(courses.map((course) => this.toCourseResponse(course)));
  }

 
}