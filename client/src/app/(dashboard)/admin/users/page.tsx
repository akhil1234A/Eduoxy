"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import { useGetStudentsQuery, useBlockUserMutation, useUnblockUserMutation } from "@/state/api/adminApi";
import { toast } from "sonner";
import UserManagementTable from "@/components/UserManagementTable";

const ManageUsers = () => {
  const { data, isLoading } = useGetStudentsQuery();
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [searchTerm, setSearchTerm] = useState("");

  const students = data?.data || [];

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

  return (
    <div className="manage-users w-full h-full">
      <Header title="Manage Users" subtitle="View and manage student accounts" />
      <UserManagementTable
        users={students}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        isLoading={isLoading}
        title="Manage Users"
        subtitle="View and manage student accounts"
        searchPlaceholder="Search students by name or email..."
        noResultsMessage="No students found"
      />
    </div>
  );
};

export default ManageUsers;
