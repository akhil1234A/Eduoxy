"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import { useGetTeachersQuery, useBlockUserMutation, useUnblockUserMutation } from "@/state/api/adminApi";
import { toast } from "sonner";
import DynamicTable from "@/components/DynamicTable";
import { Button } from "@/components/ui/button";



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

  return (
    <div className="manage-instructors w-full h-full">
      <Header title="Manage Instructors" subtitle="View and manage teacher accounts" />
      <DynamicTable<IUser>
        items={teachers}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={isLoading}
        rowKeyExtractor={(teacher) => teacher._id}
        filterFn={(teacher, term) =>
          [teacher.name, teacher.email].some((field) =>
            field.toLowerCase().includes(term.toLowerCase())
          )
        }
        searchPlaceholder="Search instructors by name or email..."
        noResultsComponent={<div>No instructors found</div>}
      />
    </div>
  );
};

export default ManageInstructors;