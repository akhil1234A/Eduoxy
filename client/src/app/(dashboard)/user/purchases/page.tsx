"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import DynamicTable from "@/components/DynamicTable";
import { useGetStudentPurchasesQuery } from "@/state/api/transactionApi";
import { toast } from "sonner";
import Cookies from "js-cookie";

interface StudentPurchase extends Record<string, unknown> {
  transactionId: string;
  date: string;
  courseName: string;
  amount?: number;
  paymentProvider: string;
}

const StudentPurchases = () => {
  const userId = Cookies.get("userId");
  const { data, isLoading, isError } = useGetStudentPurchasesQuery(userId as string);
  const [searchTerm, setSearchTerm] = useState("");

  const purchases: StudentPurchase[] = (data?.data || []).map(transaction => ({
    ...transaction,
    amount: transaction.amount || 0
  }));

  if (isError) {
    toast.error("Failed to fetch student purchases");
  }

  const columns = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "date", label: "Date" },
    { key: "courseName", label: "Course Name" },
    {
      key: "amount",
      label: "Amount",
      render: (value: unknown) => {
        const amount = value as number;
        return `₹${amount.toFixed(2)}`;
      },
    },
    { key: "paymentProvider", label: "Payment Provider" },
  ];

  return (
    <div className="student-purchases w-full h-full bg-[#1B1C22] text-white min-h-screen py-8 px-8 md:px-12">
      <Header title="My Purchases" subtitle="View your course purchase history" />
      <DynamicTable
        items={purchases}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={isLoading}
        rowKeyExtractor={(item) => (item as unknown as StudentPurchase).transactionId}
        filterFn={(item, term) => {
          const purchase = item as unknown as StudentPurchase;
          return [purchase.transactionId, purchase.courseName, purchase.paymentProvider].some((field) =>
            String(field).toLowerCase().includes(term.toLowerCase())
          );
        }}
        searchPlaceholder="Search purchases by transaction ID, course, or provider..."
        noResultsComponent={<div className="p-3 text-center text-gray-400">No purchases found</div>}
      />
    </div>
  );
};

export default StudentPurchases;