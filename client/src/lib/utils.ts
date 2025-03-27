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

export const uploadToS3 = async (
  file: File,
  type: "image" | "video" | "pdf" | "subtitle"
): Promise<{ publicUrl: string; key: string }> => {
  try {
    console.log(`Fetching presigned URL for ${type}: ${file.name}`);
    const res = await fetch(
      `http://localhost:8000/api/upload/presigned-url?type=${type}&fileName=${encodeURIComponent(file.name)}`
    );
    const { url, key, publicUrl } = await res.json();
    console.log(`Presigned URL received: ${url}`);

    if (!url || !publicUrl) {
      throw new Error("Failed to get presigned URL");
    }

    console.log(`Uploading to S3: ${url}`);
    const uploadResponse = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || (type === "subtitle" ? "text/vtt" : undefined),
      },
    });

    if (!uploadResponse.ok) {
      console.error(`Upload failed: ${uploadResponse.status} - ${await uploadResponse.text()}`);
      await fetch("http://localhost:8000/api/upload/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      throw new Error(`Failed to upload ${type} to S3`);
    }

    console.log(`Upload successful: ${publicUrl}`);
    return { publicUrl, key }; // Return both publicUrl and key
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
    const { publicUrl } = await updateS3Resource(
      typeof data.courseImage === "string" ? data.courseImage : undefined,
      data.courseImage instanceof File ? data.courseImage : undefined,
      "image"
    );
    formData.append("image", publicUrl);
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
          const { publicUrl } = await updateS3Resource(
            typeof chapter.video === "string" ? chapter.video : undefined,
            chapter.video,
            "video"
          );
          updatedSections[i].chapters[j] = {
            ...chapter,
            video: publicUrl,
            type: "Video",
          };
        } catch (error) {
          console.error(`Failed to upload video for chapter ${chapter.chapterId}:`, error);
          throw error;
        }
      }
    }
  }

  return updatedSections;
};


export const updateS3Resource = async (
  oldUrl: string | undefined,
  newFile: File | undefined,
  type: "image" | "video" | "pdf" | "subtitle"
): Promise<{ publicUrl: string; key: string }> => {
  let newUrl = oldUrl || "";
  let newKey = ""; // Track the new key
  console.log(`updateS3Resource called - oldUrl: "${oldUrl}", newFile: ${newFile ? newFile.name : "undefined"}, type: ${type}`);

  if (newFile) {
    const { publicUrl, key } = await uploadToS3(newFile, type);
    newUrl = publicUrl;
    newKey = key;
    console.log(`New file uploaded - newUrl: "${newUrl}", key: "${newKey}"`);

    if (oldUrl && oldUrl !== newUrl) {
      const bucketUrl = `https://${process.env.NEXT_PUBLIC_AWS_S3_BUCKET}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/`;
      console.log(`Checking oldUrl format - bucketUrl: "${bucketUrl}"`);
      if (!oldUrl.startsWith(bucketUrl)) {
        console.warn(`Old URL does not match expected bucket format: "${oldUrl}"`);
      } else {
        const oldKey = oldUrl.split(bucketUrl)[1];
        if (!oldKey) {
          console.error(`Failed to extract key from old URL: "${oldUrl}"`);
        } else {
          console.log(`Attempting to delete old key: "${oldKey}"`);
          try {
            const deleteResponse = await fetch("http://localhost:8000/api/upload/delete", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: oldKey }),
            });
            if (!deleteResponse.ok) {
              console.error(`Failed to delete old resource: ${await deleteResponse.text()}`);
            } else {
              console.log(`Old resource deleted successfully: "${oldKey}"`);
            }
          } catch (error) {
            console.error(`Error during DELETE request:`, error);
          }
        }
      }
    } else {
      console.log(`DELETE skipped - oldUrl: "${oldUrl}", newUrl: "${newUrl}" (no old URL or same as new)`);
    }
  } else {
    console.log(`No new file provided, returning oldUrl: "${newUrl}"`);
  }

  return { publicUrl: newUrl, key: newKey }; // Return both URL and key
};