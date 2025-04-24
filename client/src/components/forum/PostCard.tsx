import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EditPostModal } from "./EditPostModal";
import { useDeletePostMutation } from "@/state/api/forumApi";
import { toast } from "sonner";
import { FileViewer } from "@/components/FileViewer";

interface PostCardProps {
  post: IPost;
  canEdit: boolean;
  canDelete: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, canEdit, canDelete }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletePost] = useDeletePostMutation();

  const handleDelete = async () => {
    try {
      await deletePost({ postId: post._id, userId: post.userId }).unwrap();
      toast.success("Post deleted successfully");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{post.topic}</h3>
          <p className="text-sm text-gray-500">By {post.userName}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      <p className="mb-4">{post.content}</p>
      {post.files && post.files.length > 0 && (
        <div className="mb-4">
          <FileViewer files={post.files} />
        </div>
      )}
      <Link href={`/forums/${post.forumId}/posts/${post._id}`}>
        <Button variant="link" className="p-0">
          View Replies
        </Button>
      </Link>

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        onSuccess={() => {
          setIsEditModalOpen(false);
          toast.success("Post updated successfully");
        }}
      />
    </div>
  );
}; 