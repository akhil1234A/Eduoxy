import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReplySchema } from "@/lib/schema";
import { useUpdateReplyMutation } from "@/state/api/forumApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileUpload } from "@/components/FileUpload";
import { toast } from "sonner";
import { IFile } from "@/types/file";
import Cookies from "js-cookie";

interface EditReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  reply: {
    id: string;
    content: string;
    files: IFile[];
  };
}

export function EditReplyModal({ isOpen, onClose, reply }: EditReplyModalProps) {
  const [files, setFiles] = useState<IFile[]>(reply.files);
  const [updateReply, { isLoading }] = useUpdateReplyMutation();

  const form = useForm({
    resolver: zodResolver(ReplySchema),
    defaultValues: {
      content: reply.content,
    },
  });

  const onSubmit = async (data: { content: string }) => {
    try {
      const userId = Cookies.get("userId");
      const userName = Cookies.get("userName");

      if (!userId || !userName) {
        toast.error("Please sign in to update your reply");
        return;
      }

      if (!data.content.trim()) {
        toast.error("Content is required");
        return;
      }

      await updateReply({
        replyId: reply.id,
        userId,
        content: data.content.trim(),
        files: files.map((file) => ({
          url: file.url,
          key: file.key || '',
          type: file.type,
          size: file.size || 0,
          name: file.name || '',
          publicUrl: file.publicUrl,
        })),
      }).unwrap();
      toast.success("Reply updated successfully");
      onClose();
    } catch (error: unknown) {
      console.error("Failed to update reply:", error);
      toast.error("Failed to update reply");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Reply</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              {...form.register("content")}
              placeholder="Enter your reply"
              required
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-500">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Files</Label>
            <FileUpload
              files={files}
              setFiles={setFiles}
              maxFiles={5}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}