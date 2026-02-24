"use client";

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";

import DataTable from "@/components/shared/table/DataTable";
import { DataTableWithRowSelectionProps } from "@/types/data-table";
import { Rating } from "@/services/ratings/types";

export default function ReviewsTable({
    data,
    columns,
    pagination,
    rowSelection,
    setRowSelection,
}: DataTableWithRowSelectionProps<Rating>) {
    const searchParams = useSearchParams();

    const safeData = Array.isArray(data) ? data : [];

    const table = useReactTable({
        data: safeData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getRowId: (row) => row._id,
        state: {
            rowSelection,
        },
        onRowSelectionChange: (updater) => {
            const newSelectionState =
                typeof updater === "function" ? updater(rowSelection) : updater;
            setRowSelection(newSelectionState);
        },
        enableRowSelection: true,
    });

    const safePagination = pagination ?? {
        pages: 0,
        current: 1,
        prev: null,
        next: null,
        limit: 10,
        items: 0,
    };

    const mappedPagination = {
        pages: safePagination.pages ?? safePagination.totalPages ?? 0,
        current: safePagination.current ?? safePagination.currentPage ?? 1,
        prev: safePagination.prev ?? safePagination.prevPage ?? null,
        next: safePagination.next ?? safePagination.nextPage ?? null,
        limit: safePagination.limit ?? 10,
        items: safePagination.items ?? safePagination.totalItems ?? 0,
    };

    return (
        <DataTable
            table={table}
            pagination={mappedPagination}
        />
    );
}
