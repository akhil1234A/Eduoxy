'use client';

import React, { Suspense } from 'react';
import Header from '@/components/Header';
import DynamicTable from '@/components/DynamicTable';
import DashboardGraphs from '@/components/DashboardGraphs';
import { useGetAdminDashboardQuery } from '@/state/redux';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/DateRangePicker';
import { useDashboard } from '@/hooks/useDashboard';



const AdminDashboardContent = () => {
  const {
    page,
    limit,
    dateFilterType,
    startDate,
    endDate,
    tableDateFilterType,
    tableStartDate,
    tableEndDate,
    localSearchTerm,
    debouncedSearchTerm,
    selectedDateRange,
    tableSelectedDateRange,
    handleSearchChange,
    handlePageChange,
    handleDateFilterChange,
    handleTableDateFilterChange,
    handleCustomDateRangeChange,
    handleTableCustomDateRangeChange,
  } = useDashboard('/admin/dashboard');

  const { data, isLoading, isError } = useGetAdminDashboardQuery({
    page,
    limit,
    dateFilterType: dateFilterType || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    tableDateFilterType: tableDateFilterType || undefined,
    tableStartDate: tableStartDate || undefined,
    tableEndDate: tableEndDate || undefined,
  });

  const dashboardData = data?.data as AdminDashboardData | undefined;
  const {
    totalRevenue = 0,
    activeCourses = 0,
    totalEnrollments = 0,
    totalUsers = 0,
    recentTransactions = [],
    revenueGraph = { labels: [], data: [] },
    topCourses = [],
    pagination = { total: 0, page: 1, limit: 10, totalPages: 0 },
  } = dashboardData || {};

  if (isError) {
    toast.error('Failed to fetch admin dashboard data');
  }

  const columns = [
    { key: 'transactionId', label: 'Transaction ID' },
    { key: 'date', label: 'Date' },
    { key: 'courseName', label: 'Course' },
    { key: 'studentName', label: 'Student' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: unknown) => `₹${(value as number).toFixed(2)}`,
    },
  ];

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
      {isLoading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700 mb-8">
            <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
          <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
            <div className="h-6 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="h-96 bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700 hover:bg-[#35363F] transition-colors">
              <h3 className="text-lg font-semibold text-gray-300">Total Revenue</h3>
              <p className="text-2xl mt-2 text-blue-400">₹{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700 hover:bg-[#35363F] transition-colors">
              <h3 className="text-lg font-semibold text-gray-300">Active Courses</h3>
              <p className="text-2xl mt-2 text-blue-400">{activeCourses}</p>
            </div>
            <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700 hover:bg-[#35363F] transition-colors">
              <h3 className="text-lg font-semibold text-gray-300">Enrollments</h3>
              <p className="text-2xl mt-2 text-blue-400">{totalEnrollments}</p>
            </div>
            <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700 hover:bg-[#35363F] transition-colors">
              <h3 className="text-lg font-semibold text-gray-300">Users</h3>
              <p className="text-2xl mt-2 text-blue-400">{totalUsers}</p>
            </div>
          </div>
          <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4 sm:mb-0">Analytics</h3>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDateFilterChange('')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !dateFilterType ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label="Show all data"
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleDateFilterChange('day')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateFilterType === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label="Filter by last 30 days"
                  >
                    Day
                  </button>
                  <button
                    onClick={() => handleDateFilterChange('week')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateFilterType === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label="Filter by last week"
                  >
                    Week
                  </button>
                  <button
                    onClick={() => handleDateFilterChange('month')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateFilterType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label="Filter by last month"
                  >
                    Month
                  </button>
                  <button
                    onClick={() => handleDateFilterChange('custom')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      dateFilterType === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label="Select custom date range"
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
            <DashboardGraphs
              revenueGraph={revenueGraph}
              topCourses={topCourses}
              isTeacher={false}
              dateFilterType={dateFilterType}
            />
          </div>
          <div className="bg-[#2D2E36] p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4 sm:mb-0">Recent Transactions</h3>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTableDateFilterChange('')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      !tableDateFilterType ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label="Show all transactions"
                  >
                    All
                  </button>
                  <button
                    onClick={() => handleTableDateFilterChange('day')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tableDateFilterType === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label="Filter transactions by last 30 days"
                  >
                    Day
                  </button>
                  <button
                    onClick={() => handleTableDateFilterChange('week')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tableDateFilterType === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label="Filter transactions by last week"
                  >
                    Week
                  </button>
                  <button
                    onClick={() => handleTableDateFilterChange('month')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tableDateFilterType === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label="Filter transactions by last month"
                  >
                    Month
                  </button>
                  <button
                    onClick={() => handleTableDateFilterChange('custom')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tableDateFilterType === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label="Select custom date range for transactions"
                  >
                    Custom
                  </button>
                </div>
                {tableDateFilterType === 'custom' && (
                  <DateRangePicker
                    startDate={tableSelectedDateRange.startDate}
                    endDate={tableSelectedDateRange.endDate}
                    onChange={handleTableCustomDateRangeChange}
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
        </>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  return (
    <Suspense fallback={<div className="text-white text-center py-8">Loading...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
};

export default AdminDashboard;