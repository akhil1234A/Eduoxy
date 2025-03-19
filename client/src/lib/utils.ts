import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
// import { toast } from "sonner";

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
  {
    value: "CyberSecurity",
    label: "CyberSecurity",
  },
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

export const createCourseFormData = (
  data: CourseFormData,
  sections: Section[]
): FormData => {
  const formData = new FormData();
  formData.append("title", data.courseTitle);
  formData.append("description", data.courseDescription);
  formData.append("category", data.courseCategory);
  formData.append("price", data.coursePrice.toString());
  formData.append("status", data.courseStatus ? "Published" : "Draft");

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



export const uploadVideoToCloudinary = async (file: File): Promise<string> => {
  try {
    
    const res = await fetch("/api/cloudinary-signature");
    const { signature, timestamp, api_key, cloud_name } = await res.json();

    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", api_key);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);
    formData.append("folder", "course_videos");
    formData.append("upload_preset", "ml_default");
    formData.append("eager", "w_800,h_600,c_fill");
    formData.append("eager_async", "true");

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`,
      { 
        method: "POST", 
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.json();
      throw new Error(error.error?.message || "Failed to upload video");
    }

    const result = await cloudinaryResponse.json();
    return result.secure_url;
  } catch (error) {
    console.error("Video upload error:", error);
    throw error;
  }
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
          const videoUrl = await uploadVideoToCloudinary(chapter.video);
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