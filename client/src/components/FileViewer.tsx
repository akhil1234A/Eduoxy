import Image from "next/image";
import { IFile } from "@/types/file";
interface FileViewerProps {
  files: IFile[];
}

export const FileViewer: React.FC<FileViewerProps> = ({ files }) => {
  return (
    <div className="mt-2">
      {files.map((file, index) => (
        <div key={index} className="mb-2">
          {file.type.startsWith("image/") ? (
            <div className="relative w-full max-w-xs h-48">
              <Image 
                src={file.url || ""} 
                alt={file.name || "Image"} 
                className="rounded object-cover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <a href={file.url || ""} download className="text-blue-500 underline">
              {file.name || "Download File"}
            </a>
          )}
        </div>
      ))}
    </div>
  );
};