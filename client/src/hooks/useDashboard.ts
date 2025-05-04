import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, subDays, isValid } from 'date-fns';
import { toast } from 'sonner';

export const useDashboard = (basePath: string) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const searchTerm = searchParams.get('q') || '';
  const dateFilterType = (searchParams.get('dateFilterType') || '') as 'day' | 'week' | 'month' | 'custom' | '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const tableDateFilterType = (searchParams.get('tableDateFilterType') || '') as 'day' | 'week' | 'month' | 'custom' | '';
  const tableStartDate = searchParams.get('tableStartDate') || '';
  const tableEndDate = searchParams.get('tableEndDate') || '';

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedDateRange, setSelectedDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: startDate && isValid(new Date(startDate)) ? new Date(startDate) : null,
    endDate: endDate && isValid(new Date(endDate)) ? new Date(endDate) : null,
  });
  const [tableSelectedDateRange, setTableSelectedDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: tableStartDate && isValid(new Date(tableStartDate)) ? new Date(tableStartDate) : null,
    endDate: tableEndDate && isValid(new Date(tableEndDate)) ? new Date(tableEndDate) : null,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm);
      if (localSearchTerm !== searchTerm) {
        updateUrlParams({ q: localSearchTerm, page: '1' }, basePath);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchTerm, searchTerm, basePath]);

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1) {
      updateUrlParams({ page: newPage.toString() }, basePath);
    }
  };

  const handleDateFilterChange = (type: 'day' | 'week' | 'month' | 'custom' | '') => {
    if (type === '') {
      updateUrlParams(
        {
          dateFilterType: '',
          startDate: '',
          endDate: '',
          page: '1',
        },
        basePath
      );
      setSelectedDateRange({ startDate: null, endDate: null });
      return;
    }

    const now = new Date();
    let startDate = '';
    let endDate = '';

    if (type === 'day') {
      const thirtyDaysAgo = subDays(now, 30);
      startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
      setSelectedDateRange({ startDate: thirtyDaysAgo, endDate: now });
    } else if (type === 'week') {
      const sevenDaysAgo = subDays(now, 7);
      startDate = format(sevenDaysAgo, 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
      setSelectedDateRange({ startDate: sevenDaysAgo, endDate: now });
    } else if (type === 'month') {
      const thirtyDaysAgo = subDays(now, 30);
      startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
      setSelectedDateRange({ startDate: thirtyDaysAgo, endDate: now });
    } else if (type === 'custom') {
      const thirtyDaysAgo = subDays(now, 30);
      startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
      setSelectedDateRange({ startDate: thirtyDaysAgo, endDate: now });
      updateUrlParams(
        {
          dateFilterType: 'custom',
          startDate,
          endDate,
          page: '1',
        },
        basePath
      );
      return;
    }

    updateUrlParams(
      {
        dateFilterType: type,
        startDate,
        endDate,
        page: '1',
      },
      basePath
    );
  };

  const handleTableDateFilterChange = (type: 'day' | 'week' | 'month' | 'custom' | '') => {
    if (type === '') {
      updateUrlParams(
        {
          tableDateFilterType: '',
          tableStartDate: '',
          tableEndDate: '',
          page: '1',
        },
        basePath
      );
      setTableSelectedDateRange({ startDate: null, endDate: null });
      return;
    }

    const now = new Date();
    let startDate = '';
    let endDate = '';

    if (type === 'day') {
      const thirtyDaysAgo = subDays(now, 30);
      startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
      setTableSelectedDateRange({ startDate: thirtyDaysAgo, endDate: now });
    } else if (type === 'week') {
      const sevenDaysAgo = subDays(now, 7);
      startDate = format(sevenDaysAgo, 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
      setTableSelectedDateRange({ startDate: sevenDaysAgo, endDate: now });
    } else if (type === 'month') {
      const thirtyDaysAgo = subDays(now, 30);
      startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
      setTableSelectedDateRange({ startDate: thirtyDaysAgo, endDate: now });
    } else if (type === 'custom') {
      const thirtyDaysAgo = subDays(now, 30);
      startDate = format(thirtyDaysAgo, 'yyyy-MM-dd');
      endDate = format(now, 'yyyy-MM-dd');
      setTableSelectedDateRange({ startDate: thirtyDaysAgo, endDate: now });
      updateUrlParams(
        {
          tableDateFilterType: 'custom',
          tableStartDate: startDate,
          tableEndDate: endDate,
          page: '1',
        },
        basePath
      );
      return;
    }

    updateUrlParams(
      {
        tableDateFilterType: type,
        tableStartDate: startDate,
        tableEndDate: endDate,
        page: '1',
      },
      basePath
    );
  };

  const handleCustomDateRangeChange = (
    startDate: Date | null,
    endDate: Date | null
  ) => {
    setSelectedDateRange({ startDate, endDate });

    if (startDate && endDate) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (!isValid(startDate) || !isValid(endDate)) {
        toast.error('Invalid date format. Please select valid dates.');
        return;
      }
      if (startDate > today || endDate > today) {
        toast.error('Dates cannot be in the future.');
        return;
      }
      if (startDate > endDate) {
        toast.error('Start date cannot be after end date.');
        return;
      }
      updateUrlParams(
        {
          dateFilterType: 'custom',
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          page: '1',
        },
        basePath
      );
    }
  };

  const handleTableCustomDateRangeChange = (
    startDate: Date | null,
    endDate: Date | null
  ) => {
    setTableSelectedDateRange({ startDate, endDate });

    if (startDate && endDate) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (!isValid(startDate) || !isValid(endDate)) {
        toast.error('Invalid date format. Please select valid dates.');
        return;
      }
      if (startDate > today || endDate > today) {
        toast.error('Dates cannot be in the future.');
        return;
      }
      if (startDate > endDate) {
        toast.error('Start date cannot be after end date.');
        return;
      }
      updateUrlParams(
        {
          tableDateFilterType: 'custom',
          tableStartDate: format(startDate, 'yyyy-MM-dd'),
          tableEndDate: format(endDate, 'yyyy-MM-dd'),
          page: '1',
        },
        basePath
      );
    }
  };

  const updateUrlParams = (params: Record<string, string>, path: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        currentParams.set(key, value);
      } else {
        currentParams.delete(key);
      }
    });
    router.push(`${path}?${currentParams.toString()}`, { scroll: false });
  };

  return {
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
    updateUrlParams,
  };
};