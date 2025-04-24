import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PostSchema } from "@/lib/schema";
import { useUpdatePostMutation } from "@/state/api/forumApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileUpload } from "@/components/FileUpload";
import { toast } from "sonner";
import { IFile } from "@/types/file";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  post: IPost;
}

interface PostFormData {
  content: string;
  topic: string;
}

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  post,
}) => {
  const [updatePost, { isLoading }] = useUpdatePostMutation();
  const [files, setFiles] = useState<IFile[]>(() => 
    (post.files || []).map(file => {
      // Extract key from URL if not present
      const key = file.key || file.url.split('/').pop() || '';
      return {
        url: file.url,
        key: key,
        type: file.type,
        size: file.size || 0,
        name: file.name || key,
        publicUrl: file.publicUrl
      };
    })
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(PostSchema),
    defaultValues: {
      content: post.content,
      topic: post.topic,
    },
  });

  const handleFileDelete = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const onSubmit = async (data: PostFormData) => {
    try {
      // Ensure all files have a key
      const filesWithKeys = files.map(file => {
        const key = file.key || file.url.split('/').pop() || '';
        return {
          url: file.publicUrl || file.url,
          key: key,
          type: file.type,
          size: file.size,
          name: file.name || key,
          publicUrl: file.publicUrl
        };
      });

      await updatePost({
        postId: post._id,
        userId: post.userId,
        content: data.content,
        topic: data.topic,
        files: filesWithKeys,
      }).unwrap();
      reset();
      setFiles([]);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Failed to update post");
      console.error("Failed to update post:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-customgreys-primarybg text-white">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
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
              onDelete={handleFileDelete}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};