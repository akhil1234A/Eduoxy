"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useGetRoadmapsQuery, useDeleteRoadmapMutation } from "@/state/api/roadmapApi";
import { Button } from "@/components/ui/button";
import DynamicTable from "@/components/DynamicTable";

const RoadmapsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchTerm = searchParams.get("q") || "";
  
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const { data, isLoading } = useGetRoadmapsQuery({ 
    page, 
    limit, 
    searchTerm: debouncedSearchTerm 
  });
  
  const roadmaps = data?.data?.roadmaps || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;
  
  const [deleteRoadmap] = useDeleteRoadmapMutation();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm);
      // Only update URL when debounced search term changes
      if (localSearchTerm !== searchTerm) {
        const query = new URLSearchParams({
          page: "1",
          limit: limit.toString(),
          q: localSearchTerm,
        }).toString();
        router.push(`/admin/roadmaps?${query}`, { scroll: false });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchTerm, limit, router, searchTerm]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this roadmap?")) {
      try {
        await deleteRoadmap(id);
      } catch (error) {
        console.error("Failed to delete roadmap:", error);
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const query = new URLSearchParams({
        page: newPage.toString(),
        limit: limit.toString(),
        q: localSearchTerm,
      }).toString();
      router.push(`/admin/roadmaps?${query}`, { scroll: false });
    }
  };

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
  };

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (value: unknown) => String(value),
    },
    {
      key: "description",
      label: "Description",
      render: (value: unknown) => String(value),
    },
    {
      key: "sections",
      label: "Sections",
      render: (value: unknown) => Array.isArray(value) ? value.length : 0,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, item: Roadmap) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/roadmaps/${item._id}`)}
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => item._id && handleDelete(item._id)}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interview Preparation Roadmaps</h1>
        <Button onClick={() => router.push("/admin/roadmaps/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create Roadmap
        </Button>
      </div>

      <DynamicTable<Roadmap>
        items={roadmaps}
        columns={columns}
        searchTerm={localSearchTerm}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        rowKeyExtractor={(item) => item._id || ''}
        filterFn={(item, term) =>
          [item.title, item.description].some((field) =>
            String(field).toLowerCase().includes(term.toLowerCase())
          )
        }
        searchPlaceholder="Search roadmaps by title or description..."
        noResultsComponent={<div className="p-3 text-center text-gray-400">No roadmaps found</div>}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

const RoadmapsPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoadmapsContent />
    </Suspense>
  );
};

export default RoadmapsPage;