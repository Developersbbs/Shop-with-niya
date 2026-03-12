"use client";

import { useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { RowSelectionState } from "@tanstack/react-table";

import CategoriesTable from "./Table";
import { getColumns, skeletonColumns } from "./columns";
import TableSkeleton from "@/components/shared/table/TableSkeleton";
import TableError from "@/components/shared/table/TableError";

import { fetchCategories } from "@/services/categories";
import { useAuthorization } from "@/hooks/use-authorization";
import { Category } from "@/services/categories/types";
import { PaginationMeta } from "@/types/api";

interface AllCategoriesProps {
  rowSelection: RowSelectionState;
  setRowSelection: (selection: RowSelectionState) => void;
  data?: Category[];
  meta?: PaginationMeta;
}

export default function AllCategories({
  rowSelection,
  setRowSelection,
  data: propData,
  meta: propMeta,
}: AllCategoriesProps) {
  const { hasPermission } = useAuthorization();
  const columns = getColumns({ hasPermission });

  // Always call hooks at top level (Rules of Hooks)
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";

  const {
    data: categories,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["categories", page, limit, search],
    queryFn: () =>
      fetchCategories({ page, limit, search }),
    placeholderData: keepPreviousData,
    // Skip the query if data is provided via props
    enabled: !propData,
  });

  // If data is provided as props, use it directly without any queries
  if (propData && propMeta) {
    const currentPageFromProps = propMeta?.page || 1;

    return (
      <CategoriesTable
        columns={columns}
        data={propData}
        pagination={{
          pages: propMeta?.totalPages || 0,
          current: currentPageFromProps,
          prev: currentPageFromProps > 1 ? currentPageFromProps - 1 : null,
          next: currentPageFromProps < (propMeta?.totalPages || 0) ? currentPageFromProps + 1 : null,
          limit: propMeta?.limit || 10,
          items: propMeta?.total || 0,
        }}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
      />
    );
  }

  if (isLoading)
    return <TableSkeleton perPage={limit} columns={skeletonColumns} />;

  if (isError || !categories)
    return (
      <TableError
        errorMessage="Something went wrong while trying to fetch categories."
        refetch={refetch}
      />
    );

  return (
    <CategoriesTable
      columns={columns}
      data={categories?.data || []}
      pagination={{
        pages: categories?.meta?.totalPages || 0,
        current: categories?.meta?.page || 1,
        prev: categories?.meta?.page > 1 ? categories.meta.page - 1 : null,
        next: categories?.meta?.page < categories?.meta?.totalPages ? categories.meta.page + 1 : null,
        limit: categories?.meta?.limit || 10,
        items: categories?.meta?.total || 0,
      }}
      rowSelection={rowSelection}
      setRowSelection={setRowSelection}
    />
  );
}
