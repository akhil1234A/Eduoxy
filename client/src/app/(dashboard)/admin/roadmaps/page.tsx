"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useGetRoadmapsQuery, useDeleteRoadmapMutation } from "@/state/api/roadmapApi";
import { Button } from "@/components/ui/button";
import DynamicTable from "@/components/DynamicTable";


interface ApiResponse {
  data: Roadmap[];
}

const RoadmapsPage = () => {
  const { data, isLoading } = useGetRoadmapsQuery();
  const roadmaps = (data as ApiResponse)?.data || [];
  const [deleteRoadmap] = useDeleteRoadmapMutation();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(""); 

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this roadmap?")) {
      try {
        await deleteRoadmap(id);
      } catch (error) {
        console.error("Failed to delete roadmap:", error);
      }
    }
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={isLoading}
        rowKeyExtractor={(item) => item._id || ''}
        filterFn={(item, term) =>
          [item.title, item.description].some((field) =>
            String(field).toLowerCase().includes(term.toLowerCase())
          )
        }
        searchPlaceholder="Search roadmaps by title or description..."
        noResultsComponent={<div className="p-3 text-center text-gray-400">No roadmaps found</div>}
      />
    </div>
  );
};

export default RoadmapsPage;