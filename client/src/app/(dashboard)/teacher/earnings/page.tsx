"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import DynamicTable from "@/components/DynamicTable";
import { useGetTeacherEarningsQuery } from "@/state/api/transactionApi";
import { toast } from "sonner";
import Cookies from "js-cookie";




const TeacherEarnings = () => {
  const teacherId = Cookies.get("userId");
  const { data, isLoading, isError } = useGetTeacherEarningsQuery(teacherId as string);
  const [searchTerm, setSearchTerm] = useState("");

  const earnings: Transaction[] = data?.data || [];

  if (isError) {
    toast.error("Failed to fetch teacher earnings");
  }

  const columns = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "date", label: "Date" },
    { key: "courseName", label: "Course Name" },
    { key: "studentName", label: "Student Name" },
    {
      key: "earning",
      label: "Earning",
      render: (value: unknown) => `₹${(value as number).toFixed(2)}`,
    },
    { key: "paymentProvider", label: "Payment Provider" },
  ];

  return (
    <div className="teacher-earnings w-full h-full bg-[#1B1C22] text-white min-h-screen py-8 px-4 md:px-6">
      <Header title="Teacher Earnings" subtitle="View your earnings from course sales" />
      <DynamicTable<Transaction>
        items={earnings}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={isLoading}
        rowKeyExtractor={(item) => item.transactionId as string}
        filterFn={(item, term) =>
          [item.transactionId, item.courseName, item.studentName, item.paymentProvider].some((field) =>
            String(field).toLowerCase().includes(term.toLowerCase())
          )
        }
        searchPlaceholder="Search earnings by transaction ID, course, student, or provider..."
        noResultsComponent={<div className="p-3 text-center text-gray-400">No earnings found</div>}
      />
    </div>
  );
};

export default TeacherEarnings;