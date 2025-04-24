import { FileIcon } from 'lucide-react';
import Image from 'next/image';
import { IFile } from '@/types/file';

interface FileViewerProps {
  files: IFile[];
}

export const FileViewer: React.FC<FileViewerProps> = ({ files }) => {
  const formatFileSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {files.map((file, index) => (
        <div
          key={index}
          onClick={() => handleFileClick(file.url)}
          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          {file.type.startsWith('image/') ? (
            <div className="relative h-16 w-16 flex-shrink-0">
              <Image
                src={file.url}
                alt={file.name}
                fill
                className="object-cover rounded"
                sizes="64px"
                loading="lazy"
              />
            </div>
          ) : (
            <FileIcon className="h-10 w-10 text-gray-500 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-800 hover:text-blue-600 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};