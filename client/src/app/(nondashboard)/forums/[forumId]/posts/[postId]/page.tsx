'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useGetPostQuery, useGetRepliesQuery } from "@/state/api/forumApi";
import { PostCard } from "@/components/forum/PostCard";
import { ReplyCard } from "@/components/forum/ReplyCard";
import { PaginationControls } from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import { CreateReplyModal } from "@/components/forum/CreateReplyModal";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useSocket } from "@/contexts/SocketContext";

export default function PostPage() {
  const { postId } = useParams();
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [replies, setReplies] = useState<IReply[]>([]);
  const userId = Cookies.get("userId");
  const userName = Cookies.get("userName");
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

    socket.emit("joinPost", postId);

    socket.on("newReply", (newReply: IReply) => {
      setReplies((prev) => {
        // Avoid duplicates
        if (prev.some((r) => r._id === newReply._id)) return prev;
        return [...prev, newReply];
      });
      toast.success("New reply added");
    });

    return () => {
      socket.off("newReply");
    };
  }, [socket, postId]);

  if (isPostLoading || isLoading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading replies</div>;

  const post = postData?.data;
  const { total, pageSize } = data?.data || { total: 0, pageSize: 10 };

  return (
    <div className="container mx-auto py-8">
      {post && (
        <PostCard
          post={post}
          canEdit={post.userId === userId}
          canDelete={post.userId === userId}
        />
      )}

      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Replies</h2>
          <Button onClick={() => setIsCreateModalOpen(true)}>Add Reply</Button>
        </div>

        <div className="space-y-4">
          {replies.map((reply) => (
            <ReplyCard
              key={reply._id}
              reply={reply}
              canEdit={reply.userId === userId}
              canDelete={reply.userId === userId}
            />
          ))}
        </div>

        <PaginationControls
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      <CreateReplyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        postId={postId as string}
        userId={userId || ""}
        userName={userName || ""}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          toast.success("Reply created successfully");
        }}
      />
    </div>
  );
}