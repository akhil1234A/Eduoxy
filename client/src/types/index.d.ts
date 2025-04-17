declare global {


  interface IUser extends Record<string, unknown>{
    _id: string;
    name: string;
    email: string;
    userType: "student" | "admin" | "teacher";
    isVerified: boolean;
    isBlocked: boolean;
    title?: string;
    bio?: string;
    profileImage?: string;
  }

  interface Course {
    courseId: string;
    teacherId: string;
    teacherName: string;
    title: string;
    description?: string;
    category: string;
    image?: string;
    price?: number; 
    level: "Beginner" | "Intermediate" | "Advanced";
    status: "Draft" | "Published" | "Unlisted";
    sections: Section[];
    enrollments?: Array<{
      userId: string;
      userName: string
    }>;
  }

  interface Enrollment {
    userId: string;
    userName: string
  }

  interface Transaction {
    transactionId: string
    date: string
    courseName: string
    studentName?: string
    amount?: number
    earning?: number
    paymentProvider: string
    [key: string]: unknown; 
  }

  interface DateRange {
    from: string | undefined;
    to: string | undefined;
  }

  interface UserCourseProgress {
    userId: string;
    courseId: string;
    enrollmentDate: string;
    overallProgress: number;
    sections: SectionProgress[];
    lastAccessedTimestamp: string;
  }

  type CreateUserArgs = Omit<User, "userId">;
  type CreateCourseArgs = Omit<Course, "courseId">;
  type CreateTransactionArgs = Omit<Transaction, "transactionId">;

  interface CourseCardProps {
    course: Course;
    onGoToCourse: (course: Course) => void;
  }

  interface TeacherCourseCardProps {
    course: Course;
    onEdit: (course: Course) => void;
    onDelete: (course: Course) => void;
    isOwner: boolean;
  }

  interface Comment {
    commentId: string;
    userId: string;
    text: string;
    timestamp: string;
  }

  interface Chapter {
    chapterId: string;
    title: string;
    content: string;
    video?: string;
    pdf?: string;
    subtitle?: string;
    freePreview?: boolean;
    type: "Text" | "Quiz" | "Video" | "PDF";
  }

  interface ChapterProgress {
    chapterId: string;
    completed: boolean;
  }

  interface SectionProgress {
    sectionId: string;
    chapters: ChapterProgress[];
  }

  interface Section {
    sectionId: string;
    sectionTitle: string;
    sectionDescription?: string;
    chapters: Chapter[];
  }

  interface WizardStepperProps {
    currentStep: number;
  }

  interface AccordionSectionsProps {
    sections: Section[];
  }

  interface SearchCourseCardProps {
    course: Course;
    isSelected?: boolean;
    onClick?: () => void;
  }

  interface CoursePreviewProps {
    course: Course;
  }

  interface CustomFixedModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
  }

  interface HeaderProps {
    title: string;
    subtitle: string;
    rightElement?: ReactNode;
  }

  interface SharedNotificationSettingsProps {
    title?: string;
    subtitle?: string;
  }

  interface SelectedCourseProps {
    course: Course;
    handleEnrollNow: (courseId: string) => void;
  }

  interface ToolbarProps {
    onSearch: (search: string) => void;
    onCategoryChange: (category: string) => void;
  }

  interface ChapterModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionIndex: number | null;
    chapterIndex: number | null;
    sections: Section[];
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
    courseId: string;
  }

  interface SectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    sectionIndex: number | null;
    sections: Section[];
    setSections: React.Dispatch<React.SetStateAction<Section[]>>;
  }

  interface DroppableComponentProps {
    sections: Section[];
    setSections: (sections: Section[]) => void;
    handleEditSection: (index: number) => void;
    handleDeleteSection: (index: number) => void;
    handleAddChapter: (sectionIndex: number) => void;
    handleEditChapter: (sectionIndex: number, chapterIndex: number) => void;
    handleDeleteChapter: (sectionIndex: number, chapterIndex: number) => void;
  }

  interface CourseFormData {
    courseTitle: string;
    courseDescription: string;
    courseCategory: string;
    coursePrice: string;
    courseStatus: string;
    courseImage: File | string;
  }
  interface CustomFixedModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
  }

  export interface SignUpRequest {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    userType: "student" | "teacher";
  }
  
  interface LoginRequest {
    email: string;
    password: string;
  }
  
  interface VerifyOtpRequest {
    email: string;
    otp: string;
  }

  interface UserResponse {
  id:string;
  name: string;
  email: string;
  userType: "student" | "admin" | "teacher";
  isVerified: boolean;
  }
  
  interface Tokens {
    accessToken: string;
    user: UserResponse
    // refreshToken?: string;
  }

  interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string | object;
  }

  interface LoginResponseData {
    accessToken?: string;
    refreshToken?: string;
    user?: IUser;
    needsVerification?: boolean;
  }

  interface VerifyOtpResponse {
    accessToken?: string;
    refreshToken?: string;
    user?: IUser;
  }

  export interface AdminDasboard {
    totalRevenue: number
    activeCourses: number
    totalEnrollments: number
    totalUsers: number
    recentTransactions: RecentTransactionAdmin[]
  }
  
  export interface RecentTransactionAdmin extends Record<string, unknown> {
    transactionId: string
    date: string
    courseName: string
    studentName: string
    amount: number
  }
  
  export interface TeacherDasboard {
    totalEarnings: number
    totalStudents: number
    totalCourses: number
    pendingCourses: number
    recentEnrollments: RecentEnrollmentTeacher[]
  }
  
  export interface RecentEnrollmentTeacher extends Record<string, unknown> {
    studentName: string
    courseName: string
    date: string
    earning: number
  }
  
  export interface Roadmap {
    _id?: string
    title: string
    description: string
    sections: RoadmapSection[]
    createdAt?: string
    updatedAt?: string
    __v?: number
    [key: string]: unknown;
  }
  
  export interface RoadmapSection {
    id: string
    title: string
    topics: RoadmapTopic[]
  }
  
  export interface RoadmapTopic {
    id: string
    title: string
    description: string
    isCompleted: boolean
    resources: RoadmapResource[]
  }
  
  export interface RoadmapResource {
    id: string
    title: string
    url: string
    type: "article" | "video" | "link"
  }
  
  interface AppNotification {
    _id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    isRead: boolean;
    link?: string;
    createdAt: Date;
  }

  interface InitialCoursesType {
    courses: Course[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
}


export {};
