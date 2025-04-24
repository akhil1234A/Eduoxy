import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ForumSchema, ForumSchemaType } from "@/lib/schema";
import { useCreateForumMutation } from "@/state/api/forumApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Cookies from "js-cookie";

interface CreateForumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateForumModal: React.FC<CreateForumModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [createForum, { isLoading }] = useCreateForumMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForumSchemaType>({
    resolver: zodResolver(ForumSchema),
  });

  const onSubmit = async (data: ForumSchemaType) => {
    try {
      const userId = Cookies.get("userId");
      const topics = data.topics ? (data.topics as string).split(",").map((t) => t.trim()) : [];
      await createForum({
        userId: userId || "",
        title: data.title,
        description: data.description,
        topics,
      }).unwrap();
      reset();
      onSuccess();
    } catch (error) {
      console.error("Failed to create forum:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-customgreys-primarybg text-white">
        <DialogHeader>
          <DialogTitle>Create New Forum</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>
          {/* <div>
            <Label htmlFor="topics">Topics (comma-separated)</Label>
            <Input
              id="topics"
              {...register("topics")}
              placeholder="e.g., JavaScript, React, CSS"
            />
            {errors.topics && (
              <p className="text-red-500 text-sm">{errors.topics.message}</p>
            )}
          </div> */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Forum"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 