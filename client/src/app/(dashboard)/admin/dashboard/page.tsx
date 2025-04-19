"use client";

import React, { useEffect, useState, Suspense } from "react";
import Header from "@/components/Header";
import DynamicTable from "@/components/DynamicTable";
import { useGetAdminDashboardQuery } from "@/state/redux"
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/DateRangePicker";



const AdminDashboardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const searchTerm = searchParams.get("q") || "";
  const dateFilterType = (searchParams.get("dateFilterType") || "") as "week" | "month" | "custom" | "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
  });
  
  const { data, isLoading, isError } = useGetAdminDashboardQuery({
    page,
    limit,
    dateFilterType: dateFilterType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const dashboardData = data?.data as AdminDasboard | undefined;
  const {
    totalRevenue = 0,
    activeCourses = 0,
    totalEnrollments = 0,
    totalUsers = 0,
    recentTransactions = [],
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = dashboardData || {};

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm);
      // Only update URL when debounced search term changes
      if (localSearchTerm !== searchTerm) {
        updateUrlParams({ q: localSearchTerm, page: "1" });
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearchTerm, searchTerm]);

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

  const handleSearchChange = (value: string) => {
    // Update local state immediately for responsive UI
    setLocalSearchTerm(value);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
      updateUrlParams({ page: newPage.toString() });
    }
  };

  const handleDateFilterChange = (type: 'week' | 'month' | 'custom' | '') => {
    if (type === '') {
      // Clear date filter
      updateUrlParams({ 
        dateFilterType: '', 
        startDate: '', 
        endDate: '',
        page: '1'
      });
      setSelectedDateRange({ startDate: null, endDate: null });
      return;
    }

    const now = new Date();
    let startDate = '';
    let endDate = '';

    if (type === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      startDate = format(weekAgo, 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
      setSelectedDateRange({ startDate: weekAgo, endDate: now });
    } else if (type === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      startDate = format(monthAgo, 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
      setSelectedDateRange({ startDate: monthAgo, endDate: now });
    }

    updateUrlParams({ 
      dateFilterType: type, 
      startDate, 
      endDate,
      page: '1'
    });
  };

  const handleCustomDateRangeChange = (startDate: Date | null, endDate: Date | null) => {
    setSelectedDateRange({ startDate, endDate });
    
    if (startDate && endDate) {
      updateUrlParams({ 
        dateFilterType: 'custom', 
        startDate: format(startDate, 'yyyy-MM-dd'), 
        endDate: format(endDate, 'yyyy-MM-dd'),
        page: '1'
      });
    }
  };

  const updateUrlParams = (params: Record<string, string>) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    
    // Update or add new parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        currentParams.set(key, value);
      } else {
        currentParams.delete(key);
      }
    });
    
    router.push(`/admin/dashboard?${currentParams.toString()}`, { scroll: false });
  };

  // Filter transactions based on search term
  const filteredTransactions = recentTransactions.filter((item: RecentTransactionAdmin) => {
    if (!debouncedSearchTerm) return true;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      item.transactionId.toLowerCase().includes(searchLower) ||
      item.courseName.toLowerCase().includes(searchLower) ||
      item.studentName.toLowerCase().includes(searchLower)
    );
  });

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h3 className="text-xl font-semibold mb-4 md:mb-0">Recent Transactions</h3>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="flex gap-2">
              <button 
                onClick={() => handleDateFilterChange('')}
                className={`px-3 py-1 rounded ${!dateFilterType ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                All
              </button>
              <button 
                onClick={() => handleDateFilterChange('week')}
                className={`px-3 py-1 rounded ${dateFilterType === 'week' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Week
              </button>
              <button 
                onClick={() => handleDateFilterChange('month')}
                className={`px-3 py-1 rounded ${dateFilterType === 'month' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Month
              </button>
              <button 
                onClick={() => handleDateFilterChange('custom')}
                className={`px-3 py-1 rounded ${dateFilterType === 'custom' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Custom
              </button>
            </div>
            {dateFilterType === 'custom' && (
              <DateRangePicker
                startDate={selectedDateRange.startDate}
                endDate={selectedDateRange.endDate}
                onChange={handleCustomDateRangeChange}
              />
            )}
          </div>
        </div>
        <DynamicTable<RecentTransactionAdmin>
          items={filteredTransactions}
          columns={columns}
          searchTerm={localSearchTerm}
          onSearchChange={handleSearchChange}
          isLoading={isLoading}
          rowKeyExtractor={(item) => item.transactionId as string}
          filterFn={(item, term) =>
            [item.transactionId, item.courseName, item.studentName].some((field) =>
              String(field).toLowerCase().includes(term.toLowerCase())
            )
          }
          searchPlaceholder="Search transactions..."
          noResultsComponent={<div className="p-3 text-center text-gray-400">No recent transactions</div>}
          total={pagination.total}
          page={pagination.page}
          limit={pagination.limit}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
};

export default AdminDashboard;