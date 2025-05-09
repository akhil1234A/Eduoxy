"use client";

import type React from "react"

import { FileIcon, ExternalLink } from "lucide-react"
import Image from "next/image"
import type { IFile } from "@/types/file"
import { Button } from "@/components/ui/button"

interface FileViewerProps {
  files: IFile[]
}

export const FileViewer: React.FC<FileViewerProps> = ({ files }) => {
  const formatFileSize = (size?: number) => {
    if (!size) return "Unknown size"
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleFileClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  // Group files by type
  const imageFiles = files.filter((file) => file.type.startsWith("image/"))
  const otherFiles = files.filter((file) => !file.type.startsWith("image/"))

  return (
    <div className="space-y-4">
      {/* Image files grid */}
      {imageFiles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {imageFiles.map((file, index) => (
            <div
              key={index}
              onClick={() => handleFileClick(file.url)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleFileClick(file.url)
                  e.preventDefault()
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Open image ${file.name || "Unnamed Image"}`}
              className="group relative aspect-square overflow-hidden rounded-md bg-[#1e1f26] border border-[#3a3b44] hover:border-primary-600 transition-colors"
            >
              <Image
                src={file.url || "/placeholder.svg"}
                alt={file.name || "Image attachment"}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button size="sm" variant="secondary" className="bg-[#32333c]/80 hover:bg-[#32333c] text-white">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Other files list */}
      {otherFiles.length > 0 && (
        <div className="space-y-2">
          {otherFiles.map((file, index) => (
            <div
              key={index}
              onClick={() => handleFileClick(file.url)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleFileClick(file.url)
                  e.preventDefault()
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Open file ${file.name || "Unnamed File"}`}
              className="flex items-center space-x-3 p-3 rounded-md bg-[#32333c] border border-[#3a3b44] hover:border-primary-600 hover:bg-[#3d3e47] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <div className="flex-shrink-0 bg-[#1e1f26] rounded-md p-2">
                <FileIcon className="h-6 w-6 text-[#9ca3af]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{file.name || "Unnamed File"}</p>
                <p className="text-xs text-[#9ca3af]">{formatFileSize(file.size)}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-[#9ca3af] flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
