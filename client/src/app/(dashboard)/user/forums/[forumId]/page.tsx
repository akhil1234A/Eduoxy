'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useGetPostsQuery, useGetForumQuery } from "@/state/api/forumApi";
import { PostCard } from "@/components/forum/PostCard";
import { PaginationControls } from "@/components/PaginationControls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "@/components/forum/CreatePostModal";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useDebounce } from "@/hooks/useDebounce";

export default function ForumPostsPage() {
  const { forumId } = useParams();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const userId = Cookies.get("userId");
  const userName = Cookies.get("userName");

  const { data: forumData } = useGetForumQuery(forumId as string);
  const { data, isLoading, error } = useGetPostsQuery({
    forumId: forumId as string,
    page,
    pageSize: 10,
    query: debouncedSearchQuery,
  });

  // Reset to first page when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery]);

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading posts</div>;

  const posts = data?.data?.items || [];
  const { total, pageSize } = data?.data || { total: 0, pageSize: 10 };
  const forum = forumData?.data;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{forum?.title}</h1>
          <p className="text-gray-600">{forum?.description}</p>
        </div>
        <Button className="teacher-courses__header" onClick={() => setIsCreateModalOpen(true)}>Create Post</Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            canEdit={post.userId === userId}
            canDelete={post.userId === userId}
          />
        ))}
      </div>

      <PaginationControls
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        forumId={forumId as string}
        userId={userId || ""}
        userName={userName || ""}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          toast.success("Post created successfully");
        }}
      />
    </div>
  );
} 