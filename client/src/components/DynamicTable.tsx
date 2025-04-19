"use client";

import React from "react";
import { motion, TargetAndTransition, VariantLabels } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface ColumnConfig<T> {
  key: keyof T | string;
  label: string | React.ReactNode;
  render?: (value: unknown, item: T, index: number) => React.ReactNode;
}

interface DynamicTableProps<T> {
  items: T[];
  columns: ColumnConfig<T>[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  filterFn?: (item: T, searchTerm: string) => boolean;
  loadingComponent?: React.ReactNode;
  noResultsComponent?: React.ReactNode;
  rowKeyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  animationProps?: {
    initial?: TargetAndTransition | VariantLabels;
    animate?: TargetAndTransition | VariantLabels;
    transition?: object;
  };
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  dateFilter?: {
    startDate: Date | null;
    endDate: Date | null;
    onDateChange: (start: Date | null, end: Date | null) => void;
  };
}

const DynamicTable = <T extends Record<string, unknown>>({
  items,
  columns,
  searchTerm,
  onSearchChange,
  isLoading,
  filterFn,
  loadingComponent = <div className="text-center py-4 text-customgreys-dirtyGrey">Loading...</div>,
  noResultsComponent = <div className="p-3 text-center text-customgreys-dirtyGrey">No results found</div>,
  rowKeyExtractor,
  searchPlaceholder = "Search...",
  animationProps = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  },
  total,
  page,
  totalPages,
  onPageChange,
  dateFilter,
}: DynamicTableProps<T>) => {
  const defaultFilterFn = (item: T, term: string) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(term.toLowerCase())
    );

  const filteredItems = items.filter((item) =>
    filterFn ? filterFn(item, searchTerm) : defaultFilterFn(item, searchTerm)
  );

  const filteredByDate = dateFilter
    ? filteredItems.filter((item) => {
        if (!item.date || !dateFilter.startDate || !dateFilter.endDate) return true;
        const itemDate = new Date(item.date as string);
        return (
          itemDate >= dateFilter.startDate &&
          itemDate <= dateFilter.endDate
        );
      })
    : filteredItems;

  if (isLoading) {
    return loadingComponent;
  }

  return (
    <motion.div
      initial={animationProps.initial}
      animate={animationProps.animate}
      transition={animationProps.transition}
      className="w-full h-full"
    >
      <div className="mt-6 flex flex-col sm:flex-row gap-4 mb-4">
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-1/2 bg-customgreys-darkGrey text-white-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700"
        />
        {dateFilter && (
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-customgreys-darkGrey text-white-100">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter.startDate
                    ? format(dateFilter.startDate, "PPP")
                    : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-customgreys-darkGrey text-white-100">
                <Calendar
                  mode="single"
                  selected={dateFilter.startDate || undefined}
                  onSelect={(date) => dateFilter.onDateChange(date || null, dateFilter.endDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-customgreys-darkGrey text-white-100">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter.endDate
                    ? format(dateFilter.endDate, "PPP")
                    : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-customgreys-darkGrey text-white-100">
                <Calendar
                  mode="single"
                  selected={dateFilter.endDate || undefined}
                  onSelect={(date) => dateFilter.onDateChange(dateFilter.startDate, date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-customgreys-primarybg rounded-lg">
          <thead>
            <tr className="bg-customgreys-darkerGrey text-white-100">
              {columns.map((column) => (
                <th key={column.key as string} className="p-3 text-left">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredByDate.length > 0 ? (
              filteredByDate.map((item, index) => (
                <tr
                  key={rowKeyExtractor(item)}
                  className="border-b border-customgreys-darkGrey"
                >
                  {columns.map((column) => (
                    <td
                      key={column.key as string}
                      className="p-3 text-customgreys-dirtyGrey"
                    >
                      {column.render
                        ? column.render(
                            (item as Record<string, unknown>)[column.key as string] ?? "",
                            item,
                            index
                          )
                        : String((item as Record<string, unknown>)[column.key as string] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>{noResultsComponent}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center items-center gap-4 mt-6">
        <Button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2"
        >
          Previous
        </Button>
        <span className="text-lg text-gray-700">
          Page {page} of {totalPages} (Total: {total} items)
        </span>
        <Button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-4 py-2"
        >
          Next
        </Button>
      </div>
    </motion.div>
  );
};

export default DynamicTable;