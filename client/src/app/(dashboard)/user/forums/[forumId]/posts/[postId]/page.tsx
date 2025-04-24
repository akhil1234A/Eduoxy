'use client';

import { useState, useEffect} from 'react';
import { useParams } from 'next/navigation';
import { useGetPostQuery, useGetRepliesQuery } from '@/state/api/forumApi';
import { PostCard } from '@/components/forum/PostCard';
import { ReplyCard } from '@/components/forum/ReplyCard';
import { PaginationControls } from '@/components/PaginationControls';
import { Button } from '@/components/ui/button';
import { CreateReplyModal } from '@/components/forum/CreateReplyModal';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { useSocket } from '@/contexts/SocketContext';
import { Loader2 } from 'lucide-react';

export default function PostPage() {
  const { postId } = useParams();
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [replies, setReplies] = useState<IReply[]>([]);
  const userId = Cookies.get('userId');
  const { socket } = useSocket();

  const { data: postData, isLoading: isPostLoading } = useGetPostQuery(postId as string);
  const { data, isLoading, error } = useGetRepliesQuery({
    postId: postId as string,
    page,
    pageSize: 10,
  });

  useEffect(() => {
    if (data?.data?.items) {
      setReplies(data.data.items);
    }
  }, [data]);

  useEffect(() => {
    if (!socket || !postId) return;

    // Ensure postId is a string
    const postIdStr = postId.toString();
    socket.emit('joinPost', { postId: postIdStr });

    const handleNewReply = (newReply: IReply) => {
      setReplies((prev) => {
        if (prev.some((r) => r._id === newReply._id)) return prev;
        return [...prev, newReply];
      });
      toast.success('New reply added');
    };

    socket.on('newReply', handleNewReply);

    return () => {
      socket.off('newReply', handleNewReply);
      socket.emit('leavePost', { postId: postIdStr });
    };
  }, [socket, postId]);

  const post = postData?.data;
  const { total, pageSize } = data?.data || { total: 0, pageSize: 10 };

  if (isPostLoading || isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading content</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl text-white">
      {post && (
        <PostCard
          post={post}
          canEdit={post.userId === userId}
          canDelete={post.userId === userId}
        />
      )}

      <div className="mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Replies</h2>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary hover:bg-primary-dark transition-colors"
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
              />
            ))
          ) : (
            <p className="text-gray-300 text-center">No replies yet.</p>
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

      <CreateReplyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        postId={postId as string}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          toast.success('Reply created successfully');
        }}
      />
    </div>
  );
}