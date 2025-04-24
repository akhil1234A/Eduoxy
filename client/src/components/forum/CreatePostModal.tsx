import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PostSchema } from "@/lib/schema";
import { useCreatePostMutation } from "@/state/api/forumApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileUpload } from "@/components/FileUpload";
import { toast } from "sonner";
import { IFile } from "@/types/file";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  forumId: string;
  userId: string;
  userName: string;
}

type PostFormData = {
  topic: string;
  content: string;
};

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  forumId,
  userId,
  userName,
}) => {
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [files, setFiles] = useState<IFile[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(PostSchema),
  });

  const onSubmit = async (data: PostFormData) => {
    try {
      await createPost({
        forumId,
        userId,
        userName,
        content: data.content,
        topic: data.topic,
        files: files.map(file => ({
          url: file.publicUrl || file.url,
          key: file.key,
          type: file.type,
          size: file.size,
          name: file.name,
          publicUrl: file.publicUrl
        })),
      }).unwrap();
      reset();
      setFiles([]);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to create post");
      console.error("Failed to create post:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-customgreys-primarybg text-white">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input id="topic" {...register("topic")} />
            {errors.topic && (
              <p className="text-red-500 text-sm">{errors.topic.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea id="content" {...register("content")} />
            {errors.content && (
              <p className="text-red-500 text-sm">{errors.content.message}</p>
            )}
          </div>
          <div>
            <Label>Files (Optional)</Label>
            <FileUpload
              files={files}
              setFiles={setFiles}
              maxFiles={5}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 