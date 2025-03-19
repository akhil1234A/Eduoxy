"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import { useGetTeachersQuery, useBlockUserMutation, useUnblockUserMutation } from "@/state/api/adminApi";
import { toast } from "sonner";
import UserManagementTable from "@/components/UserManagementTable";

const ManageInstructors = () => {
  const { data, isLoading } = useGetTeachersQuery();
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [searchTerm, setSearchTerm] = useState("");

  const teachers = data?.data || [];

  const handleBlock = async (userId: string) => {
    try {
      await blockUser(userId).unwrap();
      toast.success("Instructor blocked successfully");
    } catch (error) {
      toast.error("Failed to block instructor");
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId).unwrap();
      toast.success("Instructor unblocked successfully");
    } catch (error) {
      toast.error("Failed to unblock instructor");
    }
  };

  return (
    <div className="manage-instructors w-full h-full">
      <Header title="Manage Instructors" subtitle="View and manage teacher accounts" />
      <UserManagementTable
        users={teachers}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        isLoading={isLoading}
        title="Manage Instructors"
        subtitle="View and manage teacher accounts"
        searchPlaceholder="Search instructors by name or email..."
        noResultsMessage="No instructors found"
      />
    </div>
  );
};

export default ManageInstructors;
