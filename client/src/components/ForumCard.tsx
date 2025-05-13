"use client";

import { useState } from "react";
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeleteForumMutation } from "@/state/api/forumApi";
import { EditForumModal } from "@/components/forum/EditForumModal";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import Loading from "./Loading";

interface ForumCardProps {
  forum: IForum;
}



export function ForumCard({ forum }: ForumCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteForum, { isLoading: isDeleting }] = useDeleteForumMutation();
  const { userType, userId, userLoading } = useUser();

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this forum?")) {
      try {
        await deleteForum({
          forumId: forum._id,
          userId: userId || "",
        }).unwrap();
        toast.success("Forum deleted successfully");
      } catch (error) {
        toast.error("Failed to delete forum: " + (error as Error).message);
      }
    }
  };

  if(userLoading) return <Loading/>
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Link href={`/${userType}/forums/${forum._id}`}>
            <CardTitle className="text-xl font-bold">{forum.title}</CardTitle>
          </Link>
          {userType === "admin" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <Link href={`/${userType}/forums/${forum._id}`}>
          <CardContent>
            <p className="text-sm text-muted-foreground">{forum.description}</p>
            
          </CardContent>
        </Link>
      </Card>

      {userType === "admin" && (
        <EditForumModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          forum={forum}
          onSuccess={() => {
            setIsEditModalOpen(false);
            toast.success("Forum updated successfully");
          }}
        />
      )}
    </>
  );
}