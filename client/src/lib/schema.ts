import * as z from "zod";

export const profileSchema = z.object({
  name: z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or less")
  .regex(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"),
  title: z.string().trim().max(100, "Title must be 100 characters or less").optional(),
  bio: z.string().trim().max(500, "Bio must be 500 characters or less").optional(),
  profileImage: z
    .union([
      z.string().url("Invalid image URL").optional(), 
      z.instanceof(File)
        .refine((file) => file.size <= 5 * 1024 * 1024, "Image must be less than 5MB")
        .refine(
          (file) => ["image/jpeg", "image/png"].includes(file.type),
          "Only JPEG or PNG images are allowed"
        ),
    ])
    .optional(),
});


export type ProfileFormData = z.infer<typeof profileSchema>;

export const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[\W_]/, "Password must contain at least one special character"), // Enforces special character
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type PasswordFormData = z.infer<typeof passwordUpdateSchema>;

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
    userType: z.enum(["student", "teacher", "admin"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });


export const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const otpSchema = z.string().length(6, 'Passcode must be 6 digits');

// Course Editor Schemas
export const courseSchema = z.object({
  courseTitle: z.string().trim().min(1, "Title is required"),
  courseDescription: z.string().trim().min(1, "Description is required"),
  courseCategory: z.string().trim().min(1, "Category is required"),
  coursePrice: z
    .string()
    .trim()
    .min(1, "Price is required")
    .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number")
    .refine((val) => parseFloat(val) >= 0, { message: "Price cannot be negative" }),
  courseStatus: z.enum(["Draft", "Published"]),
  courseImage: z
    .union([
      z.string().url("Invalid image URL").optional(),
      z.instanceof(File)
        .refine((file) => file.size <= 5 * 1024 * 1024, "Image must be less than 5MB")
        .refine(
          (file) => ["image/jpeg", "image/png"].includes(file.type),
          "Only JPEG or PNG images are allowed"
        ),
    ])
    .optional(),
});

export type CourseFormData = z.infer<typeof courseSchema>;

// Chapter Schemas
export const chapterSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  content: z.string().trim().min(10, "Content must be at least 10 characters"),
  video: z.union([z.string(), z.instanceof(File)]).optional(),
  pdf: z.union([z.instanceof(File), z.string()]).optional(),
  subtitle: z.union([z.instanceof(File), z.string()]).optional(),
});

export type ChapterFormData = z.infer<typeof chapterSchema>;

// Section Schemas
export const sectionSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
});

export type SectionFormData = z.infer<typeof sectionSchema>;

// Guest Checkout Schema
export const guestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type GuestFormData = z.infer<typeof guestSchema>;


export const ForumSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  topics: z.string().optional(),
});

export type ForumSchemaType = z.infer<typeof ForumSchema>;

export const PostSchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
  topic: z.string().trim().min(1, "Topic is required"),
  files: z
    .array(
      z.object({
        url: z.string(),
        type: z.string().refine((type) => ["image/jpeg", "image/png", "application/pdf"].includes(type), {
          message: "File must be JPEG, PNG, or PDF",
        }),
        size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB").optional(),
        name: z.string().optional(),
      })
    )
    .max(5, "Maximum 5 files allowed")
    .optional(),
});

export type PostSchemaType = z.infer<typeof PostSchema>;
export const ReplySchema = z.object({
  content: z.string().trim().min(1, "Content is required"),
  files: z
    .array(
      z.object({
        url: z.string(),
        type: z.string().refine((type) => ["image/jpeg", "image/png", "application/pdf"].includes(type), {
          message: "File must be JPEG, PNG, or PDF",
        }),
        size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB").optional(),
        name: z.string().optional(),
      })
    )
    .max(5, "Maximum 5 files allowed")
    .optional(),
});

export type ReplySchemaType = z.infer<typeof ReplySchema>;


