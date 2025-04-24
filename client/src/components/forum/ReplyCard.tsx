import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { EditReplyModal } from './EditReplyModal';
import { useDeleteReplyMutation } from '@/state/api/forumApi';
import { toast } from 'sonner';
import { FileViewer } from '@/components/FileViewer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface ReplyCardProps {
  reply: IReply;
  canEdit: boolean;
  canDelete: boolean;
}

export const ReplyCard: React.FC<ReplyCardProps> = memo(({ reply, canEdit, canDelete }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteReply, { isLoading: isDeleting }] = useDeleteReplyMutation();

  const handleDelete = async () => {
    try {
      await deleteReply({ replyId: reply._id, userId: reply.userId }).unwrap();
      toast.success('Reply deleted successfully');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-300">
            By {reply.userName} • {new Date(reply.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              disabled={isDeleting}
              className="text-white border-gray-400 hover:bg-gray-700"
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-800 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the reply.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      <p className="text-gray-200 mb-4">{reply.content}</p>
      {reply.files && reply.files.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <FileViewer files={reply.files} />
        </div>
      )}

      <EditReplyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        reply={{
          id: reply._id,
          content: reply.content,
          files: reply.files.map((file) => ({
            url: file.url,
            key: file.key || '',
            type: file.type,
            size: file.size || 0,
            name: file.name || '',
            publicUrl: file.publicUrl,
          })),
        }}
      />
    </div>
  );
});

ReplyCard.displayName = 'ReplyCard';