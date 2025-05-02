
import { FileIcon } from 'lucide-react';
import Image from 'next/image';
import { IFile } from '@/types/file';

interface FileViewerProps {
  files: IFile[];
}

export const FileViewer: React.FC<FileViewerProps> = ({ files }) => {
  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown size';
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
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleFileClick(file.url);
              e.preventDefault();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Open file ${file.name || 'Unnamed File'}`}
          className="flex items-center space-x-3 p-3 border border-[#3a3b44] rounded-lg bg-[#2a2b34] hover:bg-[#32333c] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-600"
        >
          {file.type.startsWith('image/') ? (
            <div className="relative h-12 w-12 flex-shrink-0">
              <Image
                src={file.url}
                alt={file.name}
                fill
                className="object-cover rounded bg-[#1e1f26]"
                sizes="48px"
                loading="lazy"
              />
            </div>
          ) : (
            <FileIcon className="h-8 w-8 text-[#9ca3af] flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white hover:text-indigo-400 transition-colors truncate">
              {file.name || 'Unnamed File'}
            </p>
            <p className="text-xs text-[#9ca3af]">{formatFileSize(file.size)}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
