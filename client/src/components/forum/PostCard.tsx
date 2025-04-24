import { useState, memo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EditPostModal } from './EditPostModal';
import { useDeletePostMutation } from '@/state/api/forumApi';
import { toast } from 'sonner';
import { FileViewer } from '@/components/FileViewer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface PostCardProps {
  post: IPost;
  canEdit: boolean;
  canDelete: boolean;
}

export const PostCard: React.FC<PostCardProps> = memo(({ post, canEdit, canDelete }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  const handleDelete = async () => {
    try {
      await deletePost({ postId: post._id, userId: post.userId }).unwrap();
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gray-800 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link href={`/user/forums/${post.forumId}/posts/${post._id}`}>
            <h3 className="text-xl font-semibold text-white hover:text-blue-400 transition-colors">{post.topic}</h3>
          </Link>
          <p className="text-sm text-gray-300">By {post.userName} • {new Date(post.createdAt).toLocaleDateString()}</p>
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
                    This action cannot be undone. This will permanently delete the post.
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
      <div className="mb-4">
        <p className="text-gray-200">{post.content}</p>
      </div>
      {post.files && post.files.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <FileViewer files={post.files} />
        </div>
      )}

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        onSuccess={() => {
          setIsEditModalOpen(false);
          toast.success('Post updated successfully');
        }}
      />
    </div>
  );
});

PostCard.displayName = 'PostCard';