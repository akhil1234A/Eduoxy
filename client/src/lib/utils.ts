import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents || 0) / 100);
}

export function centsToDollars(cents: number | undefined): string {
  return ((cents || 0) / 100).toString();
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



async function uploadVideo(chapter, courseId, sectionId) {
  const file = chapter.video;

  if (!(file instanceof File) || file.type !== "video/mp4") {
    throw new Error("Invalid file type. Only MP4 videos are supported.");
  }

  try {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("courseId", courseId);
    formData.append("sectionId", sectionId);
    formData.append("chapterId", chapter.chapterId);

    const response = await fetch("/api/upload-video", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload video");
    }

    const { videoUrl } = await response.json();
    toast.success(`Video uploaded successfully for chapter ${chapter.chapterId}`);

    return { ...chapter, video: videoUrl };
  } catch (error) {
    console.error(`Failed to upload video for chapter ${chapter.chapterId}:`, error);
    toast.error(`Failed to upload video for chapter ${chapter.chapterId}`);
    throw error;
  }
}

export const uploadAllVideos = async (localSections, courseId) => {
  const updatedSections = localSections.map((section) => ({
    ...section,
    chapters: section.chapters.map((chapter) => ({ ...chapter })),
  }));

  for (let i = 0; i < updatedSections.length; i++) {
    for (let j = 0; j < updatedSections[i].chapters.length; j++) {
      const chapter = updatedSections[i].chapters[j];
      if (chapter.video instanceof File && chapter.video.type === "video/mp4") {
        try {
          const updatedChapter = await uploadVideo(
            chapter,
            courseId,
            updatedSections[i].sectionId
          );
          updatedSections[i].chapters[j] = updatedChapter;
        } catch (error) {
          console.error(`Failed to upload video for chapter ${chapter.chapterId}:`, error);
        }
      }
    }
  }

  return updatedSections;
};