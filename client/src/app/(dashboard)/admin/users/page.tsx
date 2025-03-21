"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import { useGetStudentsQuery, useBlockUserMutation, useUnblockUserMutation } from "@/state/api/adminApi";
import { toast } from "sonner";
import DynamicTable from "@/components/DynamicTable";
import { Button } from "@/components/ui/button";

interface Student {
  _id: string;
  name: string;
  email: string;
  isBlocked: boolean;
  isVerified: boolean;
}

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

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "isBlocked",
      label: "Status",
      render: (value: boolean) => (value ? "Blocked" : "Active"),
    },
    {
      key: "isVerified",
      label: "Verified",
      render: (value: boolean) => (value ? "Yes" : "No"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, student: Student) => (
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

  return (
    <div className="manage-users w-full h-full">
      <Header title="Manage Users" subtitle="View and manage student accounts" />
      <DynamicTable
        items={students}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={isLoading}
        rowKeyExtractor={(student) => student._id}
        filterFn={(student, term) =>
          [student.name, student.email].some((field) =>
            field.toLowerCase().includes(term.toLowerCase())
          )
        }
        searchPlaceholder="Search students by name or email..."
        noResultsComponent={<div>No students found</div>}
      />
    </div>
  );
};

export default ManageUsers;