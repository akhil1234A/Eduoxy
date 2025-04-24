import { Input } from "@/components/ui/input";
import { useState } from "react";
import { uploadToS3 } from "@/lib/utils";
import { toast } from "sonner";
import { IFile } from "@/types/file";

interface FileUploadProps {
  files: IFile[];
  setFiles: (files: IFile[]) => void;
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({ files, setFiles, maxFiles = 5 }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (!newFiles || newFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    try {
      const uploadedFiles: IFile[] = [...files];
      for (const file of Array.from(newFiles)) {
        if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) {
          toast.error("Only JPEG, PNG, or PDF allowed");
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File size must be less than 5MB");
          continue;
        }
        const { publicUrl, key, url } = await uploadToS3(file, file.type.startsWith("image") ? "image" : "pdf");
        uploadedFiles.push({
          url: publicUrl || url,
          key,
          type: file.type,
          size: file.size,
          name: file.name,
          publicUrl
        });
      }
      setFiles(uploadedFiles);
      toast.success("Files uploaded successfully");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Input
      type="file"
      multiple
      accept="image/jpeg,image/png,application/pdf"
      onChange={handleFileChange}
      disabled={uploading}
      className="mt-2"
    />
  );
};