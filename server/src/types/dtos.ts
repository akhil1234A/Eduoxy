
export interface CertificateResponse {
    id: string;
    courseName: string; 
    certificateUrl: string;
    issuedAt: string;
    courseId: string;
    certificateId: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ForumResponse {
  _id: string;
  title: string;
  description: string;
}

export interface UserResponse {
  _id: string,
  name: string,
  email: string,
  userType: string,
  title?: string,
  bio?: string,
  profileImage?: string
}