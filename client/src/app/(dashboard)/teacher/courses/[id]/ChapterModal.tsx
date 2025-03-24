"use client";

import { CustomFormField } from "@/components/CustomFormField";
import CustomModal from "@/components/CustomModal";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChapterFormData, chapterSchema } from "@/lib/schema";
import { addChapter, closeChapterModal, editChapter } from "@/state";
import { useAppDispatch, useAppSelector } from "@/state/redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { uploadToS3 } from "@/lib/utils";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB in bytes

interface Chapter extends ChapterFormData {
  chapterId: string;
  type: "Video" | "Text" | "PDF";
}

const ChapterModal = () => {
  const dispatch = useAppDispatch();
  const { isChapterModalOpen, selectedSectionIndex, selectedChapterIndex, sections } =
    useAppSelector((state) => state.global.courseEditor);

  const chapter: Chapter | undefined =
    selectedSectionIndex !== null && selectedChapterIndex !== null
      ? sections[selectedSectionIndex].chapters[selectedChapterIndex]
      : undefined;

  const methods = useForm<ChapterFormData>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: "",
      content: "",
      video: "",
      pdf: "",
      subtitle: "",
    },
  });

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (chapter) {
      methods.reset({
        title: chapter.title,
        content: chapter.content,
        video: chapter.video || "",
        pdf: chapter.pdf || "",
        subtitle: chapter.subtitle || "",
      });
    } else {
      methods.reset({
        title: "",
        content: "",
        video: "",
        pdf: "",
        subtitle: "",
      });
    }
  }, [chapter, methods]);

  const onClose = () => {
    dispatch(closeChapterModal());
  };

  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size exceeds limit of ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
      return false;
    }
    return true;
  };

  const onSubmit = async (data: ChapterFormData) => {
    if (selectedSectionIndex === null) return;

    setIsUploading(true);
    let videoUrl = "";
    let pdfUrl = "";
    let subtitleUrl = "";

    // Handle video upload
    if (data.video instanceof File) {
      if (!validateFileSize(data.video)) {
        setIsUploading(false);
        return;
      }
      const toastId = toast.loading("Uploading video...");
      try {
        videoUrl = await uploadToS3(data.video, "video");
        toast.success("Video uploaded successfully", { id: toastId });
      } catch (error) {
        toast.error("Failed to upload video", { id: toastId });
        console.error("Video upload error:", error);
        setIsUploading(false);
        return;
      }
    } else if (typeof data.video === "string") {
      videoUrl = data.video;
    }

    // Handle PDF upload
    if (data.pdf instanceof File) {
      if (!validateFileSize(data.pdf)) {
        setIsUploading(false);
        return;
      }
      const toastId = toast.loading("Uploading PDF...");
      try {
        pdfUrl = await uploadToS3(data.pdf, "pdf");
        toast.success("PDF uploaded successfully", { id: toastId });
      } catch (error) {
        toast.error("Failed to upload PDF", { id: toastId });
        console.error("PDF upload error:", error);
        setIsUploading(false);
        return;
      }
    } else if (typeof data.pdf === "string") {
      pdfUrl = data.pdf;
    }

    // Handle subtitle upload (now .vtt)
    if (data.subtitle instanceof File) {
      if (!validateFileSize(data.subtitle)) {
        setIsUploading(false);
        return;
      }
      const toastId = toast.loading("Uploading subtitle...");
      try {
        subtitleUrl = await uploadToS3(data.subtitle, "subtitle");
        toast.success("Subtitle uploaded successfully", { id: toastId });
      } catch (error) {
        toast.error("Failed to upload subtitle", { id: toastId });
        console.error("Subtitle upload error:", error);
        setIsUploading(false);
        return;
      }
    } else if (typeof data.subtitle === "string") {
      subtitleUrl = data.subtitle;
    }

    const newChapter: Chapter = {
      chapterId: chapter?.chapterId || uuidv4(),
      title: data.title,
      content: data.content,
      type: videoUrl ? "Video" : pdfUrl ? "PDF" : "Text",
      video: videoUrl,
      pdf: pdfUrl,
      subtitle: subtitleUrl,
    };

    if (selectedChapterIndex === null) {
      dispatch(
        addChapter({
          sectionIndex: selectedSectionIndex,
          chapter: newChapter,
        })
      );
    } else {
      dispatch(
        editChapter({
          sectionIndex: selectedSectionIndex,
          chapterIndex: selectedChapterIndex,
          chapter: newChapter,
        })
      );
    }

    toast.success(
      `Chapter added/updated successfully but you need to save the course to apply the changes`
    );
    setIsUploading(false);
    onClose();
  };

  return (
    <CustomModal isOpen={isChapterModalOpen} onClose={onClose}>
      <div className="chapter-modal">
        <div className="chapter-modal__header">
          <h2 className="chapter-modal__title">Add/Edit Chapter</h2>
          <button onClick={onClose} className="chapter-modal__close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <Form {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="chapter-modal__form">
            <CustomFormField
              name="title"
              label="Chapter Title"
              placeholder="Write chapter title here"
            />

            <CustomFormField
              name="content"
              label="Chapter Content"
              type="textarea"
              placeholder="Write chapter content here"
            />

            <FormField
              control={methods.control}
              name="video"
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel className="text-customgreys-dirtyGrey text-sm">
                    Chapter Video
                  </FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onChange(file);
                        }}
                        className="border-none bg-customgreys-darkGrey py-2 cursor-pointer"
                      />
                      {typeof value === "string" && value && (
                        <div className="my-2 text-sm text-gray-600">
                          Current video: {value.split("/").pop()}
                        </div>
                      )}
                      {value instanceof File && (
                        <div className="my-2 text-sm text-gray-600">
                          Selected file: {value.name}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={methods.control}
              name="pdf"
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel className="text-customgreys-dirtyGrey text-sm">
                    Chapter PDF
                  </FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onChange(file);
                        }}
                        className="border-none bg-customgreys-darkGrey py-2 cursor-pointer"
                      />
                      {typeof value === "string" && value && (
                        <div className="my-2 text-sm text-gray-600">
                          Current PDF: {value.split("/").pop()}
                        </div>
                      )}
                      {value instanceof File && (
                        <div className="my-2 text-sm text-gray-600">
                          Selected file: {value.name}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={methods.control}
              name="subtitle"
              render={({ field: { onChange, value } }) => (
                <FormItem>
                  <FormLabel className="text-customgreys-dirtyGrey text-sm">
                    Chapter Subtitle (.vtt)
                  </FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        accept=".vtt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onChange(file);
                        }}
                        className="border-none bg-customgreys-darkGrey py-2 cursor-pointer"
                      />
                      {typeof value === "string" && value && (
                        <div className="my-2 text-sm text-gray-600">
                          Current subtitle: {value.split("/").pop()}
                        </div>
                      )}
                      {value instanceof File && (
                        <div className="my-2 text-sm text-gray-600">
                          Selected file: {value.name}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="chapter-modal__actions">
              <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary-700" disabled={isUploading}>
                Save
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </CustomModal>
  );
};

export default ChapterModal;