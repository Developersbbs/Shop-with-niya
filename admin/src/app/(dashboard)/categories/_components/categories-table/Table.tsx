"use client";

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import DataTable from "@/components/shared/table/DataTable";
import { DataTableWithRowSelectionProps } from "@/types/data-table";
import { Category } from "@/services/categories/types";

export default function CategoryTable({
  data,
  columns,
  pagination,
  rowSelection,
  setRowSelection,
}: DataTableWithRowSelectionProps<Category>) {

  // Ensure data is always an array
  const safeData = Array.isArray(data) ? data : [];

  const table = useReactTable({
    data: safeData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => {
      const id = row._id || row.id;
      return id;
    },
    state: {
      rowSelection,
    },
    onRowSelectionChange: (updater) => {
      const newSelectionState =
        typeof updater === "function" ? updater(rowSelection) : updater;
      
      console.log("Row selection changed:", newSelectionState);
      setRowSelection(newSelectionState);
    },
    enableRowSelection: true,
  });

  // Provide default pagination object with flexible property mapping
  const safePagination = pagination ?? {
    pages: 0,
    current: 1,
    prev: null,
    next: null,
    limit: 10,
    items: 0,
  };

  // Map pagination properties flexibly to handle different naming conventions
  const mappedPagination = {
    pages: safePagination.pages ?? 0,
    current: safePagination.current ?? 1,
    prev: safePagination.prev ?? null,
    next: safePagination.next ?? null,
    limit: safePagination.limit ?? 10,
    items: safePagination.items ?? 0,
  };

  return (
    <DataTable
      table={table}
      pagination={mappedPagination}
    />
  );
}