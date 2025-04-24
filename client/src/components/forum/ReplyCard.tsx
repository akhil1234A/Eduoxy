import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EditReplyModal } from "./EditReplyModal";
import { useDeleteReplyMutation } from "@/state/api/forumApi";
import { toast } from "sonner";
import { FileViewer } from "@/components/FileViewer";

interface ReplyCardProps {
  reply: IReply;
  canEdit: boolean;
  canDelete: boolean;
}

export const ReplyCard: React.FC<ReplyCardProps> = ({ reply, canEdit, canDelete }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteReply] = useDeleteReplyMutation();

  const handleDelete = async () => {
    try {
      await deleteReply({ replyId: reply._id, userId: reply.userId }).unwrap();
      toast.success("Reply deleted successfully");
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-500">By {reply.userName}</p>
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
      <p className="mb-4">{reply.content}</p>
      {reply.files && reply.files.length > 0 && (
        <div className="mb-4">
          <FileViewer files={reply.files} />
        </div>
      )}

      <EditReplyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        reply={{
          id: reply._id,
          content: reply.content,
          files: reply.files.map(file => ({
            url: file.url,
            key: file.key || '',
            type: file.type,
            size: file.size || 0,
            name: file.name || '',
            publicUrl: file.publicUrl
          }))
        }}
      />
    </div>
  );
}; 