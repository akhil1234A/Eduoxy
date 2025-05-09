"use client";

import React, { useEffect, useState, Suspense } from "react";
import Header from "@/components/Header";
import DynamicTable from "@/components/DynamicTable";
import { useGetStudentPurchasesQuery } from "@/state/api/transactionApi";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/Loading";
const UserPurchaseContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchTerm = searchParams.get("q") || "";
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  const userId = Cookies.get("userId") || localStorage.getItem("userId");
  const { data, isLoading, isError } = useGetStudentPurchasesQuery({ 
    userId: userId as string,
    page, 
    limit, 
    searchTerm: debouncedSearchTerm 
  });

  const purchases: Transaction[] = data?.data?.transactions || [];
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
        router.push(`/user/purchases?${query}`, { scroll: false });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [localSearchTerm, limit, router, searchTerm]);

  if (isError) {
    toast.error("Failed to fetch user purchases");
  }

  const columns = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "date", label: "Date" },
    { key: "courseName", label: "Course Name" },
    { key: "teacherName", label: "Teacher Name" },
    {
      key: "amount",
      label: "Amount",
      render: (value: unknown) => `₹${(value as number).toFixed(2)}`,
    },
    { key: "paymentProvider", label: "Payment Provider" },
    { key: "status", label: "Status" },
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
      router.push(`/user/purchases?${query}`, { scroll: false });
    }
  };

  return (
    <div className="user-purchases w-full h-full bg-[#1B1C22] text-white min-h-screen py-8 px-4 md:px-6">
      <Header title="My Purchases" subtitle="View your course purchase history" />
      <DynamicTable<Transaction>
        items={purchases}
        columns={columns}
        searchTerm={localSearchTerm}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        rowKeyExtractor={(item) => item.transactionId as string}
        filterFn={(item, term) =>
          [item.transactionId, item.courseName, item.teacherName, item.paymentProvider, item.status].some((field) =>
            String(field).toLowerCase().includes(term.toLowerCase())
          )
        }
        searchPlaceholder="Search purchases by transaction ID, course, teacher, provider, or status..."
        noResultsComponent={<div className="p-3 text-center text-gray-400">No purchases found</div>}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

const UserPurchases = () => {
  return (
    <Suspense fallback={<Loading />}>
      <UserPurchaseContent />
    </Suspense>
  );
};


export default UserPurchases;