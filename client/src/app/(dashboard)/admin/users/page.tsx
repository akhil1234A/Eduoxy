"use client";

import React, { useEffect, useState, Suspense } from "react";
import Header from "@/components/Header";
import { useGetStudentsQuery, useBlockUserMutation, useUnblockUserMutation } from "@/state/api/adminApi";
import { toast } from "sonner";
import DynamicTable from "@/components/DynamicTable";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";

const ManageUsersContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchTerm = searchParams.get("q") || "";
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const { data, isLoading } = useGetStudentsQuery({ page, limit, searchTerm: debouncedSearchTerm });
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();

  const studentsData = data?.data || { users: [], total: 0, page: 1, limit: 10, totalPages: 0 };
  const { users, total, totalPages } = studentsData;

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
        router.push(`/admin/users?${query}`, { scroll: false });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchTerm, limit, router, searchTerm]);

  const handleBlock = async (userId: string) => {
    try {
      await blockUser(userId).unwrap();
      toast.success("User blocked successfully");
    } catch (error) {
      console.error("Block user error:", error);
      toast.error("Failed to block user");
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId).unwrap();
      toast.success("User unblocked successfully");
    } catch (error) {
      console.error("Unblock user error:", error);
      toast.error("Failed to unblock user");
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
      render: (_: unknown, student: IUser) => (
        <Button
          onClick={() => (student.isBlocked ? handleUnblock(student._id) : handleBlock(student._id))}
          variant="outline"
          size="sm"
          className="bg-customgreys-primarybg text-customgreys-dirtyGrey hover:bg-customgreys-darkerGrey hover:text-white-50"
        >
          {student.isBlocked ? "Unblock" : "Block"}
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
      router.push(`/admin/users?${query}`, { scroll: false });
    }
  };

  return (
    <div className="manage-users w-full h-full container mx-auto px-4 py-8">
      <Header title="Manage Users" subtitle="View and manage student accounts" />
      <DynamicTable<IUser>
        items={users}
        columns={columns}
        searchTerm={localSearchTerm}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        rowKeyExtractor={(student) => student._id}
        filterFn={(student, term) =>
          [student.name, student.email].some((field) =>
            field.toLowerCase().includes(term.toLowerCase())
          )
        }
        searchPlaceholder="Search students by name or email..."
        noResultsComponent={<div className="p-3 text-center text-gray-400">No students found</div>}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

const ManageUsers = ()=>{
  return (
    <Suspense fallback={<Loading />}>
      <ManageUsersContent />
    </Suspense>
  )
}

export default ManageUsers;