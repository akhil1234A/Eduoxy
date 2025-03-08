"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useGetTeachersQuery, useBlockUserMutation, useUnblockUserMutation } from "@/state/api/adminApi";
import Loading from "@/components/Loading";
import { toast } from "sonner";

const ManageInstructors = () => {
  const { data, isLoading } = useGetTeachersQuery();
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [searchTerm, setSearchTerm] = useState("");

  // Memoized teachers data
  const teachers = useMemo(() => data?.data || [], [data]);

  // Memoized filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(
      (teacher) =>
        teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teachers, searchTerm]);

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

  if (isLoading) return <Loading />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="manage-instructors w-full h-full"
    >
      <Header title="Manage Instructors" subtitle="View and manage teacher accounts" />
      <div className="mt-6">
        <input
          type="text"
          placeholder="Search instructors by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 mb-4 border-none bg-customgreys-darkGrey text-white-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700"
        />
        <div className="overflow-x-auto">
          <table className="min-w-full bg-customgreys-primarybg rounded-lg">
            <thead>
              <tr className="bg-customgreys-darkerGrey text-white-100">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Verified</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher._id} className="border-b border-customgreys-darkGrey">
                    <td className="p-3 text-white-100">{teacher.name}</td>
                    <td className="p-3 text-customgreys-dirtyGrey">{teacher.email}</td>
                    <td className="p-3 text-customgreys-dirtyGrey">
                      {teacher.isBlocked ? "Blocked" : "Active"}
                    </td>
                    <td className="p-3 text-customgreys-dirtyGrey">
                      {teacher.isVerified ? "Yes" : "No"}
                    </td>
                    <td className="p-3">
                      {teacher.isBlocked ? (
                        <Button
                          onClick={() => handleUnblock(teacher._id)}
                          variant="outline"
                          size="sm"
                          className="bg-customgreys-primarybg text-customgreys-dirtyGrey hover:bg-customgreys-darkerGrey hover:text-white-50"
                        >
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleBlock(teacher._id)}
                          variant="outline"
                          size="sm"
                          className="bg-customgreys-primarybg text-customgreys-dirtyGrey hover:bg-customgreys-darkerGrey hover:text-white-50"
                        >
                          Block
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-3 text-center text-customgreys-dirtyGrey">
                    No instructors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default ManageInstructors;
