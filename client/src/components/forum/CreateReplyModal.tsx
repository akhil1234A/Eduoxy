"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReplySchema } from '@/lib/schema';
import { useCreateReplyMutation } from '@/state/api/forumApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileUpload } from '@/components/FileUpload';
import { toast } from 'sonner';
import { IFile } from '@/types/file';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

interface CreateReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  postId: string;
  parentReplyId?: string | null;
  level?: number;
}

interface ReplyFormData {
  content: string;
}

const MAX_REPLY_DEPTH = 1;

export const CreateReplyModal: React.FC<CreateReplyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  postId,
  parentReplyId,
  level = 0,
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

  console.log(parentReplyId, 'Parent Reply ID from props');
  console.log(level, 'Level from props');

  const {userId, userName } = useUser();

  const onSubmit = async (data: ReplyFormData) => {
    try {


      if (!userId || !userName) {
        toast.error('Please sign in to create a reply');
        return;
      }

      if (level >= MAX_REPLY_DEPTH) {
        toast.error('Maximum reply depth reached');
        onClose();
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
          publicUrl: file.publicUrl,
        })),
        parentReplyId: parentReplyId || null,
      }).unwrap();

      reset();
      setFiles([]);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Failed to create reply');
      console.error('Failed to create reply:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2a2b34] text-white border-[#3a3b44] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {parentReplyId ? 'Add Nested Reply' : 'Add Reply'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="content" className="text-sm font-medium text-[#9ca3af]">
              Content
            </Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Write your reply..."
              className="mt-1 min-h-[120px] bg-[#1e1f26] text-white border-[#3a3b44] focus:ring-indigo-600 focus:border-indigo-600"
              required
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>
          <div>
            <Label className="text-sm font-medium text-[#9ca3af]">
              Files (Optional, max 5)
            </Label>
            <div className="mt-1">
              <FileUpload
                files={files}
                setFiles={setFiles}
                maxFiles={5}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="bg-[#1e1f26] text-white hover:bg-[#32333c] border-[#3a3b44]"
              aria-label="Cancel reply"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              aria-label="Submit reply"
            >
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              {isLoading ? 'Submitting...' : 'Submit Reply'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};