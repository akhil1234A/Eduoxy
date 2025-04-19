"use client";

import React, { useEffect, useState, Suspense } from "react";
import Header from "@/components/Header";
import DynamicTable from "@/components/DynamicTable";
import { useGetTeacherEarningsQuery } from "@/state/api/transactionApi";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from '@/components/Loading'

const TeacherEarningsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchTerm = searchParams.get("q") || "";
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  const teacherId = Cookies.get("userId");
  const { data, isLoading, isError } = useGetTeacherEarningsQuery({ 
    teacherId: teacherId as string,
    page, 
    limit, 
    searchTerm: debouncedSearchTerm 
  });

  const earnings: Transaction[] = data?.data?.transactions || [];
  const total = data?.data?.total || 0;
  const totalPages = data?.data?.totalPages || 1;

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
        router.push(`/teacher/earnings?${query}`, { scroll: false });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchTerm, limit, router, searchTerm]);

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
      router.push(`/teacher/earnings?${query}`, { scroll: false });
    }
  };

  return (
    <div className="teacher-earnings w-full h-full bg-[#1B1C22] text-white min-h-screen py-8 px-4 md:px-6">
      <Header title="Teacher Earnings" subtitle="View your earnings from course sales" />
      <DynamicTable<Transaction>
        items={earnings}
        columns={columns}
        searchTerm={localSearchTerm}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        rowKeyExtractor={(item) => item.transactionId as string}
        filterFn={(item, term) =>
          [item.transactionId, item.courseName, item.studentName, item.paymentProvider].some((field) =>
            String(field).toLowerCase().includes(term.toLowerCase())
          )
        }
        searchPlaceholder="Search earnings by transaction ID, course, student, or provider..."
        noResultsComponent={<div className="p-3 text-center text-gray-400">No earnings found</div>}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

const TeacherEarnings = ()=>{
  return (
    <Suspense fallback={<Loading />}>
      <TeacherEarningsContent />
    </Suspense>
  )
}

export default TeacherEarnings;