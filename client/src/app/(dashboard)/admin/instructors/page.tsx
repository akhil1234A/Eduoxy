"use client";

import React, { useEffect, useState, Suspense } from "react";
import Header from "@/components/Header";
import { useGetTeachersQuery, useBlockUserMutation, useUnblockUserMutation } from "@/state/api/adminApi";
import { toast } from "sonner";
import DynamicTable from "@/components/DynamicTable";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";

const ManageInstructorsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchTerm = searchParams.get("q") || "";
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const { data, isLoading } = useGetTeachersQuery({ page, limit, searchTerm: debouncedSearchTerm });
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();

  const teachersData = data?.data || { users: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  const { users: teachers, total, totalPages } = teachersData;

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
        router.push(`/admin/instructors?${query}`, { scroll: false });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchTerm, limit, router, searchTerm]);

  const handleBlock = async (userId: string) => {
    try {
      await blockUser(userId).unwrap();
      toast.success("Instructor blocked successfully");
    } catch (error) {
      toast.error("Failed to block instructor", {
        description: (error as Error).message,
      });
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId).unwrap();
      toast.success("Instructor unblocked successfully");
    } catch (error) {
      toast.error("Failed to unblock instructor", {
        description: (error as Error).message,
      });
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "isBlocked",
      label: "Status",
      render: (value: unknown, item: IUser) => (item.isBlocked ? "Blocked" : "Active"),
    },
    {
      key: "isVerified",
      label: "Verified",
      render: (value: unknown, item: IUser) => (item.isVerified ? "Yes" : "No"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, teacher: IUser) => (
        <Button
          onClick={() => (teacher.isBlocked ? handleUnblock(teacher._id) : handleBlock(teacher._id))}
          variant="outline"
          size="sm"
          className="bg-customgreys-primarybg text-customgreys-dirtyGrey hover:bg-customgreys-darkerGrey hover:text-white-50"
        >
          {teacher.isBlocked ? "Unblock" : "Block"}
        </Button>
      ),
    },
  ];

  const handleSearchChange = (value: string) => {
    // Update local state immediately for responsive UI
    setLocalSearchTerm(value);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const query = new URLSearchParams({
        page: newPage.toString(),
        limit: limit.toString(),
        q: localSearchTerm,
      }).toString();
      router.push(`/admin/instructors?${query}`, { scroll: false });
    }
  };

  return (
    <div className="manage-instructors w-full h-full container mx-auto px-4 py-8">
      <Header title="Manage Instructors" subtitle="View and manage teacher accounts" />
      <DynamicTable<IUser>
        items={teachers}
        columns={columns}
        searchTerm={localSearchTerm}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        rowKeyExtractor={(teacher) => teacher._id}
        filterFn={(teacher, term) =>
          [teacher.name, teacher.email].some((field) =>
            field.toLowerCase().includes(term.toLowerCase())
          )
        }
        searchPlaceholder="Search instructors by name or email..."
        noResultsComponent={<div className="p-3 text-center text-gray-400">No instructors found</div>}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

const ManageInstructors = ()=>{
  return (
    <Suspense fallback={<Loading />}>
      <ManageInstructorsContent />
    </Suspense>
  )
}

export default ManageInstructors;