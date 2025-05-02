'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetPostQuery, useGetRepliesQuery, useDeletePostMutation } from '@/state/api/forumApi';
import { Button } from '@/components/ui/button';
import { CreateReplyModal } from '@/components/forum/CreateReplyModal';
import { PaginationControls } from '@/components/PaginationControls';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { useSocket } from '@/contexts/SocketContext';
import { Loader2, Edit, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { FileViewer } from '@/components/FileViewer';
import { ReplyCard } from '@/components/forum/ReplyCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { EditPostModal } from '@/components/forum/EditPostModal';

export default function PostPage() {
  const { postId } = useParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const userId = Cookies.get('userId');
  const { socket } = useSocket();

  const { data: postData, isLoading: isPostLoading } = useGetPostQuery(postId as string);
  const { 
    data: repliesData, 
    isLoading: isRepliesLoading,
    refetch: refetchReplies 
  } = useGetRepliesQuery({
    postId: postId as string,
    page,
    pageSize: 10,
  });

  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  useEffect(() => {
    if (!socket || !postId) return;

    const postIdStr = postId.toString();
    socket.emit('joinPost', { postId: postIdStr });

    const handleNewReply = (newReply: IReplyTreeNode) => {
      console.log('New reply received:', newReply);
      refetchReplies();
      toast.success('Reply added');
    };

    socket.on('newReply', handleNewReply);

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
      toast.error(error.message);
    });

    return () => {
      socket.off('newReply', handleNewReply);
      socket.off('error');
      socket.emit('leavePost', { postId: postIdStr });
    };
  }, [socket, postId, refetchReplies]);

  const post = postData?.data;
  const { items: replies = [], total = 0, pageSize = 10 } = repliesData?.data || {};

  const handleDelete = async () => {
    if (!post) return;
    try {
      await deletePost({ postId: post._id, userId: post.userId }).unwrap();
      toast.success('Post deleted successfully');
      router.push(`/user/forums/${post.forumId}`);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (isPostLoading || isRepliesLoading) {
    return (
      <div className="flex justify-center items-center py-8 bg-[#25262f]">
        <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-8 text-red-600 bg-[#25262f]">
        Post not found
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl min-h-screen bg-[#25262f] text-white">
      <Link href={`/user/forums/${post.forumId}`} className="text-indigo-400 hover:text-indigo-300 transition-colors mb-6 inline-block">
        Back to Forum
      </Link>
      {/* Post Header */}
      <div className="bg-[#2a2b34] rounded-lg shadow-md mb-6 border border-[#3a3b44]">
        <div className="p-6 border-b border-[#3a3b44]">
          <h1 className="text-3xl font-bold text-white">{post.topic}</h1>
          <div className="flex items-center mt-2 text-sm text-[#9ca3af]">
            <User className="h-5 w-5 mr-2" />
            <span>Posted by {post.userName}</span>
            <span className="mx-2">•</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="p-6">
          <p className="text-white mb-4">{post.content}</p>
          {post.files && post.files.length > 0 && (
            <div className="mt-4">
              <FileViewer files={post.files} />
            </div>
          )}
          <div className="flex gap-2 mt-4">
            {post.userId === userId && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-white border-[#3a3b44] hover:bg-[#32333c] transition-colors"
                  aria-label="Edit post"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" disabled={isDeleting} aria-label="Delete post">
                      {isDeleting ? (
                        <Loader2 className="animate-spin h-4 w-4" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#2a2b34] text-white border-[#3a3b44]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#9ca3af]">
                        This action cannot be undone. This will permanently delete the post and all its replies.
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div className="bg-[#2a2b34] rounded-lg shadow-md p-6 border border-[#3a3b44]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white">
            Replies ({total})
          </h2>
          <Button
            onClick={() => setIsReplyModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            aria-label="Add reply"
          >
            Add Reply
          </Button>
        </div>
        <div className="space-y-6">
          {replies.length ? (
            replies.map((reply) => (
              <ReplyCard
                key={reply._id}
                reply={reply}
                canEdit={reply.userId === userId}
                canDelete={reply.userId === userId}
                postId={postId as string}
                level={0}
              />
            ))
          ) : (
            <p className="text-[#9ca3af] text-center">
              No replies yet.
            </p>
          )}
        </div>
        <div className="mt-8">
          <PaginationControls
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Modals */}
      <CreateReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        postId={postId as string}
        onSuccess={() => {
          setIsReplyModalOpen(false);
          refetchReplies();
          toast.success('Reply created successfully');
        }}
      />

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
}