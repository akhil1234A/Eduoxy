"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import DynamicTable from "@/components/DynamicTable";
import { useGetTeacherDashboardQuery } from "@/state/redux"
import { toast } from "sonner";
import Cookies from "js-cookie";


const TeacherDashboard = () => {
  const teacherId = Cookies.get("userId");
  const { data, isLoading, isError } = useGetTeacherDashboardQuery(teacherId as string);
  const [searchTerm, setSearchTerm] = useState("");

  const dashboardData = data?.data || {};
  const {
    totalEarnings = 0,
    totalStudents = 0,
    totalCourses = 0,
    pendingCourses = 0,
    recentEnrollments = [],
  } = dashboardData;

  if (isError) {
    toast.error("Failed to fetch teacher dashboard data");
  }

  const columns = [
    { key: "studentName", label: "Student" },
    { key: "courseName", label: "Course" },
    { key: "date", label: "Date" },
    {
      key: "earning",
      label: "Earning",
      render: (value: number) => `₹${value.toFixed(2)}`,
    },
  ];

  return (
    <div className="teacher-dashboard w-full h-full bg-[#1B1C22] text-white min-h-screen py-8 px-4 md:px-6">
      <Header title="Instructor Dashboard" subtitle="Your Teaching Overview" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold">Total Earnings</h3>
          <p className="text-2xl mt-2">₹{totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold">Students</h3>
          <p className="text-2xl mt-2">{totalStudents}</p>
        </div>
        <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold">Courses</h3>
          <p className="text-2xl mt-2">{totalCourses}</p>
        </div>
        <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold">Pending</h3>
          <p className="text-2xl mt-2">{pendingCourses}</p>
        </div>
      </div>
      <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Recent Enrollments</h3>
        <DynamicTable
          items={recentEnrollments}
          columns={columns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={isLoading}
          rowKeyExtractor={(item) => `${item.studentName}-${item.courseName}-${item.date}`}
          filterFn={(item, term) =>
            [item.studentName, item.courseName].some((field) =>
              String(field).toLowerCase().includes(term.toLowerCase())
            )
          }
          searchPlaceholder="Search enrollments..."
          noResultsComponent={<div className="p-3 text-center text-gray-400">No recent enrollments</div>}
        />
      </div>
    </div>
  );
};

export default TeacherDashboard;