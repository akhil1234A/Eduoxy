import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReplySchema } from "@/lib/schema";
import { useCreateReplyMutation } from "@/state/api/forumApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileUpload } from "@/components/FileUpload";
import { toast } from "sonner";
import { IFile } from "@/types/file";
import Cookies from "js-cookie";

interface CreateReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  postId: string;
}

interface ReplyFormData {
  content: string;
}

export const CreateReplyModal: React.FC<CreateReplyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  postId,
}) => {
  const [createReply, { isLoading }] = useCreateReplyMutation();
  const [files, setFiles] = useState<IFile[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReplyFormData>({
    resolver: zodResolver(ReplySchema),
  });

  const onSubmit = async (data: ReplyFormData) => {
    try {
      const userId = Cookies.get("userId");
      const userName = Cookies.get("userName");

      if (!userId || !userName) {
        toast.error("Please sign in to create a reply");
        return;
      }

      await createReply({
        postId,
        userId,
        userName,
        content: data.content,
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
      toast.error("Failed to create reply");
      console.error("Failed to create reply:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-customgreys-primarybg text-white">
        <DialogHeader>
          <DialogTitle>Create New Reply</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea 
              id="content" 
              {...register("content")} 
              placeholder="Enter your reply"
              required
            />
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
              {isLoading ? "Creating..." : "Create Reply"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};