declare global {


  interface IUser {
    id: string;
    name: string;
    email: string;
    userType: "student" | "admin" | "teacher";
    isVerified: boolean;
    isBlocked: boolean;
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
    }>;
  }

  interface Transaction {
    userId: string;
    transactionId: string;
    dateTime: string;
    courseId: string;
    paymentProvider: "stripe";
    paymentMethodId?: string;
    amount: number; // Stored in paisa
    savePaymentMethod?: boolean;
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
    freePreview?: boolean;
    type: "Text" | "Quiz" | "Video";
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
  
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

export interface Problem {
  _id?: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  testCases: TestCase[];
  starterCode: string;
  solution: string;
  category: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CodeExecutionRequest {
  code: string;
  language: string;
  testCase: string;
}

export interface CodeSubmissionRequest {
  problemId: string;
  code: string;
  language: string;
}

export interface ExecutionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
}

export interface SubmissionResult {
  results: {
    testCase: TestCase;
    result: ExecutionResult;
    passed: boolean;
  }[];
  passedAll: boolean;
}

export {};
