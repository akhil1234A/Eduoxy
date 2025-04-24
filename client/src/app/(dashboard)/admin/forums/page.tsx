'use client';

import { useState } from "react";
import { useGetForumsQuery } from "@/state/api/forumApi";
import { ForumCard } from "@/components/ForumCard";
import { PaginationControls } from "@/components/PaginationControls";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CreateForumModal } from "@/components/forum/CreateForumModal";
import { toast } from "sonner";

export default function AdminForumsPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data, isLoading, error } = useGetForumsQuery({ page, pageSize: 10, query });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-500">Error loading forums</div>;

  const forums = data?.data?.items || [];
  const { total, pageSize } = data?.data || { total: 0, pageSize: 10 };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Forums</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create Forum</Button>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Search forums..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forums.map((forum) => (
          <ForumCard key={forum._id} forum={forum} />
        ))}
      </div>

      <PaginationControls
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <CreateForumModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          toast.success("Forum created successfully");
        }}
      />
    </div>
  );
} 