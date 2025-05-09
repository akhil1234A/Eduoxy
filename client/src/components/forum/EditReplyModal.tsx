'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReplySchema } from '@/lib/schema';
import { useUpdateReplyMutation } from '@/state/api/forumApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileUpload } from '@/components/FileUpload';
import { toast } from 'sonner';
import { IFile } from '@/types/file';
import Cookies from 'js-cookie';
import { Loader2 } from 'lucide-react';

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
  const [files, setFiles] = useState<IFile[]>(
    (reply.files || []).map(file => {
      const key = file.key || file.url.split('/').pop() || '';
      return {
        url: file.url,
        key: key,
        type: file.type,
        size: file.size || 0,
        name: file.name || key,
        publicUrl: file.publicUrl,
      };
    })
  );
  const [updateReply, { isLoading }] = useUpdateReplyMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(ReplySchema),
    defaultValues: {
      content: reply.content,
    },
  });

  const onSubmit = async (data: { content: string }) => {
    try {
      const userId = Cookies.get('userId') || localStorage.getItem("userId");
      const userName = Cookies.get('userName') || localStorage.getItem("userName");

      if (!userId || !userName) {
        toast.error('Please sign in to update your reply');
        return;
      }

      if (!data.content.trim()) {
        toast.error('Content is required');
        return;
      }

      const filesWithKeys = files.map(file => {
        const key = file.key || file.url.split('/').pop() || '';
        return {
          url: file.publicUrl || file.url,
          key: key,
          type: file.type,
          size: file.size,
          name: file.name || key,
          publicUrl: file.publicUrl,
        };
      });

      await updateReply({
        replyId: reply.id,
        userId,
        content: data.content.trim(),
        files: filesWithKeys,
      }).unwrap();
      toast.success('Reply updated successfully');
      onClose();
    } catch (error: unknown) {
      console.error('Failed to update reply:', error);
      toast.error('Failed to update reply');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#2a2b34] text-white border-[#3a3b44] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">Edit Reply</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="content" className="text-sm font-medium text-[#9ca3af]">
              Content
            </Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Enter your reply"
              className="mt-1 min-h-[120px] bg-[#1e1f26] text-white border-[#3a3b44] focus:ring-indigo-600 focus:border-indigo-600"
              required
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content.message}</p>
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
              aria-label="Cancel edit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              aria-label="Save changes"
            >
              {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}