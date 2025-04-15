"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import DynamicTable from "@/components/DynamicTable";
import { useGetAdminDashboardQuery } from "@/state/redux"
import { toast } from "sonner";



const AdminDashboard = () => {
  const { data, isLoading, isError } = useGetAdminDashboardQuery();
  const [searchTerm, setSearchTerm] = useState("");

  const dashboardData = data?.data;
  const {
    totalRevenue = 0,
    activeCourses = 0,
    totalEnrollments = 0,
    totalUsers = 0,
    recentTransactions = [],
  } = dashboardData || {};

  if (isError) {
    toast.error("Failed to fetch admin dashboard data");
  }

  const columns = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "date", label: "Date" },
    { key: "courseName", label: "Course" },
    { key: "studentName", label: "Student" },
    {
      key: "amount",
      label: "Amount",
      render: (value: unknown) => `₹${(value as number).toFixed(2)}`,
    },
  ];

  return (
    <div className="admin-dashboard w-full h-full bg-[#1B1C22] text-white min-h-screen py-8 px-4 md:px-6">
      <Header title="Admin Dashboard" subtitle="Platform Overview" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold">Total Revenue</h3>
          <p className="text-2xl mt-2">₹{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold">Active Courses</h3>
          <p className="text-2xl mt-2">{activeCourses}</p>
        </div>
        <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold">Enrollments</h3>
          <p className="text-2xl mt-2">{totalEnrollments}</p>
        </div>
        <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
          <h3 className="text-lg font-semibold">Users</h3>
          <p className="text-2xl mt-2">{totalUsers}</p>
        </div>
      </div>
      <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Recent Transactions</h3>
        <DynamicTable<RecentTransactionAdmin>
          items={recentTransactions}
          columns={columns}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={isLoading}
          rowKeyExtractor={(item) => item.transactionId as string}
          filterFn={(item, term) =>
            [item.transactionId, item.courseName, item.studentName].some((field) =>
              String(field).toLowerCase().includes(term.toLowerCase())
            )
          }
          searchPlaceholder="Search transactions..."
          noResultsComponent={<div className="p-3 text-center text-gray-400">No recent transactions</div>}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;