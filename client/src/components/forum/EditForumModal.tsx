import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUpdateForumMutation } from "@/state/api/forumApi";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";
interface EditForumModalProps {
  isOpen: boolean;
  onClose: () => void;
  forum: IForum;
  onSuccess: () => void;
}

export function EditForumModal({ isOpen, onClose, forum, onSuccess }: EditForumModalProps) {
  const [title, setTitle] = useState(forum.title);
  const [description, setDescription] = useState(forum.description);
  const [topics, setTopics] = useState(forum.topics.join(", "));
  const [updateForum, { isLoading }] = useUpdateForumMutation();
  const {userId} = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateForum({
        forumId: forum._id,
        userId: userId || "",
        title,
        description,
        topics: topics.split(",").map(topic => topic.trim()).filter(Boolean),
      }).unwrap();
      onSuccess();
      onClose();
      toast.success("Forum updated successfully");
    } catch (error) {
      toast.error("Failed to update forum, " + (error as Error).message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-customgreys-primarybg text-white">
        <DialogHeader>
          <DialogTitle>Edit Forum</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topics">Topics (comma-separated)</Label>
            <Input
              id="topics"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="e.g. General, Support, Feedback"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Forum"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 