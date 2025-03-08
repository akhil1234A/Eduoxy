"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useGetStudentsQuery, useBlockUserMutation, useUnblockUserMutation } from "@/state/api/adminApi";
import Loading from "@/components/Loading";
import { toast } from "sonner";

const ManageUsers = () => {
  const { data, isLoading } = useGetStudentsQuery();
  const [blockUser] = useBlockUserMutation();
  const [unblockUser] = useUnblockUserMutation();
  const [searchTerm, setSearchTerm] = useState("");

  // Memoized students data
  const students = useMemo(() => data?.data || [], [data]);

  // Memoized filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

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

  if (isLoading) return <Loading />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="manage-users w-full h-full"
    >
      <Header title="Manage Users" subtitle="View and manage student accounts" />
      <div className="mt-6">
        <input
          type="text"
          placeholder="Search students by name or email..."
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
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student._id} className="border-b border-customgreys-darkGrey">
                    <td className="p-3 text-white-100">{student.name}</td>
                    <td className="p-3 text-customgreys-dirtyGrey">{student.email}</td>
                    <td className="p-3 text-customgreys-dirtyGrey">
                      {student.isBlocked ? "Blocked" : "Active"}
                    </td>
                    <td className="p-3 text-customgreys-dirtyGrey">
                      {student.isVerified ? "Yes" : "No"}
                    </td>
                    <td className="p-3">
                      {student.isBlocked ? (
                        <Button
                          onClick={() => handleUnblock(student._id)}
                          variant="outline"
                          size="sm"
                          className="bg-customgreys-primarybg text-customgreys-dirtyGrey hover:bg-customgreys-darkerGrey hover:text-white-50"
                        >
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleBlock(student._id)}
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
                    No students found
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

export default ManageUsers;
