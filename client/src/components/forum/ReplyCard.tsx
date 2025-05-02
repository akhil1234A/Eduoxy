'use client';

import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { EditReplyModal } from './EditReplyModal';
import { CreateReplyModal } from './CreateReplyModal';
import { useDeleteReplyMutation } from '@/state/api/forumApi';
import { toast } from 'sonner';
import { FileViewer } from '@/components/FileViewer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, User, ChevronDown, ChevronUp } from 'lucide-react';
import Cookies from 'js-cookie';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReplyCardProps {
  reply: IReplyTreeNode;
  canEdit: boolean;
  canDelete: boolean;
  postId: string;
  level?: number;
}

const MAX_REPLY_DEPTH = 1;

export const ReplyCard: React.FC<ReplyCardProps> = memo(({ reply, canEdit, canDelete, postId, level = 0 }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [showNestedReplies, setShowNestedReplies] = useState(false);
  const [deleteReply, { isLoading: isDeleting }] = useDeleteReplyMutation();
  const userId = Cookies.get('userId');

  const handleDelete = async () => {
    try {
      await deleteReply({ replyId: reply._id, userId: reply.userId }).unwrap();
      toast.success('Reply deleted successfully');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const isMaxDepthReached = level >= MAX_REPLY_DEPTH;

  return (
    <div className={`border-l-4 ${reply.parentReplyId ? 'ml-8 border-indigo-400' : 'border-indigo-600'} bg-[#2a2b34] rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border-[#3a3b44]`} style={{ marginLeft: `${level * 2}rem` }}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <User className="h-8 w-8 text-[#9ca3af]" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-medium text-white">{reply.userName}</p>
              <p className="text-xs text-[#9ca3af]">
                {new Date(reply.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  disabled={isDeleting}
                  className="text-white border-[#3a3b44] hover:bg-[#32333c]"
                  aria-label="Edit reply"
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
                      aria-label="Delete reply"
                    >
                      {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Delete'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#2a2b34] text-white border-[#3a3b44]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#9ca3af]">
                        This action cannot be undone. This will permanently delete the reply and its nested replies.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-[#1e1f26] text-white hover:bg-[#32333c] border-[#3a3b44]">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <p className="text-white mb-4">{reply.content}</p>
          {reply.files && reply.files.length > 0 && (
            <div className="border-t border-[#3a3b44] pt-4 mb-4">
              <FileViewer files={reply.files} />
            </div>
          )}
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsReplyModalOpen(true)}
                      disabled={isMaxDepthReached}
                      className={`text-indigo-400 ${isMaxDepthReached ? 'opacity-50 cursor-not-allowed' : 'hover:text-indigo-300'}`}
                      aria-label="Reply to comment"
                    >
                      Reply
                    </Button>
                  </span>
                </TooltipTrigger>
                {isMaxDepthReached && (
                  <TooltipContent>
                    <p>Maximum reply depth reached</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            {reply.children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNestedReplies(!showNestedReplies)}
                className="text-[#9ca3af] hover:text-white"
                aria-label={showNestedReplies ? 'Hide replies' : 'Show replies'}
              >
                {showNestedReplies ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" /> Hide Replies ({reply.children.length})
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" /> Show Replies ({reply.children.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {showNestedReplies && reply.children.length > 0 && (
        <div className="mt-4 space-y-4">
          {reply.children.map((nestedReply) => (
            <ReplyCard
              key={nestedReply._id}
              reply={nestedReply}
              canEdit={nestedReply.userId === userId}
              canDelete={nestedReply.userId === userId}
              postId={postId}
              level={level + 1}
            />
          ))}
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

      <CreateReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        postId={postId}
        parentReplyId={reply._id}
        level={level}
        onSuccess={() => {
          setIsReplyModalOpen(false);
          toast.success('Reply created successfully');
        }}
      />
    </div>
  );
});

ReplyCard.displayName = 'ReplyCard';