// /lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | undefined): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price || 0);
}

export const customStyles = "text-gray-300 placeholder:text-gray-500";

export const NAVBAR_HEIGHT = 48;

export const courseCategories = [
  { value: "Web Development", label: "Web Development" },
  { value: "Data Science", label: "Data Science" },
  { value: "Machine Learning", label: "Machine Learning" },
  { value: "CyberSecurity", label: "CyberSecurity" },
] as const;

export const customDataGridStyles = {
  border: "none",
  backgroundColor: "#17181D",
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: "#1B1C22",
    color: "#6e6e6e",
    "& [role='row'] > *": {
      backgroundColor: "#1B1C22 !important",
      border: "none !important",
    },
  },
  "& .MuiDataGrid-cell": {
    color: "#6e6e6e",
    border: "none !important",
  },
  "& .MuiDataGrid-row": {
    backgroundColor: "#17181D",
    "&:hover": {
      backgroundColor: "#25262F",
    },
  },
  "& .MuiDataGrid-footerContainer": {
    backgroundColor: "#17181D",
    color: "#6e6e6e",
    border: "none !important",
  },
  "& .MuiDataGrid-filler": {
    border: "none !important",
    backgroundColor: "#17181D !important",
    borderTop: "none !important",
    "& div": {
      borderTop: "none !important",
    },
  },
  "& .MuiTablePagination-root": {
    color: "#6e6e6e",
  },
  "& .MuiTablePagination-actions .MuiIconButton-root": {
    color: "#6e6e6e",
  },
};

// /lib/utils.ts
export const uploadToS3 = async (
  file: File,
  type: "image" | "video" | "pdf" | "subtitle"
): Promise<string> => {
  try {
    const folder = type === "video" ? "course_videos" : type === "pdf" ? "course_pdfs" : type === "subtitle" ? "course_subtitles" : "course_images";
    const res = await fetch(
      `/api/s3-presigned-url?type=${type}&fileName=${encodeURIComponent(file.name)}`
    );
    const { url, publicUrl } = await res.json();

    if (!url || !publicUrl) {
      throw new Error("Failed to get presigned URL");
    }

    const uploadResponse = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || (type === "subtitle" ? "text/vtt" : undefined),
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload ${type} to S3`);
    }

    return publicUrl;
  } catch (error) {
    console.error(`${type} upload error:`, error);
    throw error;
  }
};

export const createCourseFormData = async (
  data: CourseFormData,
  sections: Section[]
): Promise<FormData> => {
  const formData = new FormData();
  formData.append("title", data.courseTitle);
  formData.append("description", data.courseDescription);
  formData.append("category", data.courseCategory);
  formData.append("price", data.coursePrice.toString());
  formData.append("status", data.courseStatus ? "Published" : "Draft");

  if (data.courseImage) {
    formData.append("image", data.courseImage);
  }

  const sectionsWithVideos = sections.map((section) => ({
    ...section,
    chapters: section.chapters.map((chapter) => ({
      ...chapter,
      video: chapter.video,
    })),
  }));

  formData.append("sections", JSON.stringify(sectionsWithVideos));

  return formData;
};

export const uploadAllVideos = async (localSections: Section[], courseId: string) => {
  const updatedSections = localSections.map((section) => ({
    ...section,
    chapters: section.chapters.map((chapter) => ({ ...chapter })),
  }));

  for (let i = 0; i < updatedSections.length; i++) {
    for (let j = 0; j < updatedSections[i].chapters.length; j++) {
      const chapter = updatedSections[i].chapters[j];
      if (chapter.video instanceof File && chapter.video.type.startsWith("video/")) {
        try {
          const videoUrl = await uploadToS3(chapter.video, "video"); 
          updatedSections[i].chapters[j] = {
            ...chapter,
            video: videoUrl,
            type: "Video",
          };
        } catch (error) {
          console.error(`Failed to upload video for chapter ${chapter.chapterId}:`, error);
        }
      }
    }
  }

  return updatedSections;
};