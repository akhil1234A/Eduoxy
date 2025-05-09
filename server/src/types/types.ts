import { Request } from "express";
import { IUser } from "../models/user.model";
import { ICourseDocument } from "../models/course.model";

export enum UserRole {
  ADMIN = "admin",
  STUDENT = "student",
  TEACHER = "teacher"
}

export enum CourseLevel {
  Beginner = "Beginner",
  Intermediate = "Intermediate",
  Advanced = "Advanced",
}

export enum CourseStatus {
  Draft = "Draft",
  Published = "Published",
  Unlisted = "Unlisted",
}

export enum ChapterType {
  Text = "Text",
  Quiz = "Quiz",
  Video = "Video",
  PDF = "PDF",
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    userType: UserRole;
  }
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string | object;
}

export const successResponse = <T>(message: string, data?: T): ApiResponse<T> => ({
  success: true,
  message,
  data,
});

export const errorResponse = (message: string, error?: string | object): ApiResponse<never> => ({
  success: false,
  message,
  error,
});

export interface UserResponse {
  id: string
  name: string;
  email: string;
  userType: UserRole
  isVerified: boolean;
}

export interface AuthTokens{
  accessToken: string;
  refreshToken: string; 
}

export interface LoginUser {
  id?: string;
  email: string;
  userType: UserRole
  name?: string; 
  isVerified?: boolean; 
}
export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: LoginUser;
  needsVerification?:boolean;
}

export interface CourseCreationInput {
  teacherId: string;
  teacherName: string;
}

export interface IInitialCoursesResponse {
  courses: ICourseDocument[];
  total: number;
}

interface TimeSpent {
  hours: number;
  minutes: number;
}

interface DashboardCourseCard {
  courseId: string;
  title: string;
  progress: number;
  completed: boolean;
  lastAccessed: string;
  enrollmentDate: string;
  timeSpent: TimeSpent;
}

export interface Certificate {
  certificateId: string;
  courseId: string;
  courseName: string;
  certificateUrl: string;
  issuedAt: string;
}
  export interface UserDashboardResponse {
  timeSpent: TimeSpent;
  completedChapters: number;
  certificatesEarned: number;
  certificates: Certificate[];
  enrolledCourses: {
    startLearning: { courseId: string; title: string; progress: number; completed: boolean; lastAccessed: string; enrollmentDate: string, timeSpent: TimeSpent }[];
    continueLearning: { courseId: string; title: string; progress: number; completed: boolean; lastAccessed: string; enrollmentDate: string, timeSpent: TimeSpent }[];
    completedCourses: { courseId: string; title: string; progress: number; completed: boolean; lastAccessed: string; enrollmentDate: string, timeSpent: TimeSpent}[];
  };
  }

  export interface AdminDashboardResponse {
    totalRevenue: number
    activeCourses: number
    totalEnrollments: number
    totalUsers: number
    recentTransactions: RecentTransactionAdmin[]
    revenueGraph: { labels: string[]; data: number[] };
    topCourses: { name: string; revenue: number; enrollments: number }[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
  
  export interface RecentTransactionAdmin extends Record<string, unknown> {
    transactionId: string
    date: string
    courseName: string
    studentName: string
  }
  
  export interface TeacherDashboardResponse {
    totalEarnings: number
    totalStudents: number
    totalCourses: number
    pendingCourses: number
    recentEnrollments: RecentEnrollmentTeacher[]
    revenueGraph: { labels: string[]; data: number[] };
    topCourses: { name: string; revenue: number; enrollments: number }[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
  
  export interface RecentEnrollmentTeacher extends Record<string, unknown> {
    studentName: string
    courseName: string
    date: string
  }
  

  export interface OtpContext {
    otp: string;
    expiresIn: number;
  }
  
  export interface PasswordResetContext {
    resetUrl: string;
  }
  
  export interface WelcomeContext {
    name: string;
  }

  export type TemplateContext = OtpContext | PasswordResetContext | WelcomeContext;

  
  export interface TransactionResponse {
    transactionId: string
    date: string
    courseName: string
    studentName?: string
    amount?: number
    earning?: number
    paymentProvider: string
    [key: string]: unknown; 
  }

  export interface PaginationQuery {
    query: {
      page: string;
      limit: string;
      q: string; 
    }
  }

  export interface Course {
    courseId: string;
    teacherId: string;
    teacherName: string;
    title: string;
    description?: string;
    category: string;
    image?: string;
    price?: number; 
    level: "Beginner" | "Intermediate" | "Advanced";
    status: CourseStatus;
    sections: Section[];
    enrollments?: Array<{
      userId: string;
      studentName: string
    }>;
  }

  export interface Section {
    sectionId: string;
    sectionTitle: string;
    sectionDescription?: string;
    chapters: Chapter[];
  }

  export interface Chapter {
    chapterId: string;
    title: string;
    content: string;
    video?: string;
    pdf?: string;
    subtitle?: string;
    freePreview?: boolean;
    type: "Text" | "Quiz" | "Video" | "PDF";
  }

  export interface UserCourseProgress {
    userId: string;
    courseId: string;
    enrollmentDate: string;
    overallProgress: number;
    sections: SectionProgress[];
    lastAccessedTimestamp: string;
  }

  export interface SectionProgress {
    sectionId: string;
    chapters: ChapterProgress[];
  }

  export interface ChapterProgress {
    chapterId: string;
    completed: boolean;
  }
