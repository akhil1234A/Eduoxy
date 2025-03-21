"use client";

import React from "react";
import { motion } from "framer-motion";


interface ColumnConfig<T> {
  key: keyof T | string;
  label: string | React.ReactNode; 
  render?: (value: any, item: T, index: number) => React.ReactNode; 
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
    initial?: object;
    animate?: object;
    transition?: object;
  };
}

const DynamicTable = <T,>({
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
}: DynamicTableProps<T>) => {
  // Default filter function if none provided
  const defaultFilterFn = (item: T, term: string) =>
    Object.values(item as any).some((value) =>
      String(value).toLowerCase().includes(term.toLowerCase())
    );

  const filteredItems = items.filter((item) =>
    filterFn ? filterFn(item, searchTerm) : defaultFilterFn(item, searchTerm)
  );

  if (isLoading) {
    return loadingComponent;
  }

  return (
    <motion.div
      {...animationProps}
      className="w-full h-full"
    >
      <div className="mt-6">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full p-2 mb-4 border-none bg-customgreys-darkGrey text-white-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700"
        />
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
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
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
                              (item as any)[column.key] ?? "",
                              item,
                              index
                            )
                          : String((item as any)[column.key] ?? "")}
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
      </div>
    </motion.div>
  );
};

export default DynamicTable;