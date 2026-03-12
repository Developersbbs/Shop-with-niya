"use client";

import { useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect } from "react";

import CouponsTable from "./Table";
import { getColumns, skeletonColumns } from "./columns";
import TableSkeleton from "@/components/shared/table/TableSkeleton";
import TableError from "@/components/shared/table/TableError";

import { getSearchParams } from "@/helpers/getSearchParams";
import { fetchCoupons } from "@/services/coupons";
import { Coupon } from "@/services/coupons/types";
import { RowSelectionProps } from "@/types/data-table";
import { useAuthorization } from "@/hooks/use-authorization";

export default function AllCoupons({
  rowSelection,
  setRowSelection,
  onDataChange,
}: RowSelectionProps & { onDataChange?: (data: Coupon[]) => void }) {
  const { hasPermission } = useAuthorization();
  const columns = getColumns({ hasPermission });
  const { page, limit, search } = getSearchParams(useSearchParams());

  const {
    data: coupons,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["coupons", page, limit, search],
    queryFn: () => fetchCoupons({ page, limit, search }),
    placeholderData: keepPreviousData,
  });

  // Update parent component when data changes
  useEffect(() => {
    if (onDataChange && coupons?.data) {
      onDataChange(coupons.data);
    }
  }, [coupons, onDataChange]);

  if (isLoading)
    return <TableSkeleton perPage={limit} columns={skeletonColumns} />;

  if (isError || !coupons)
    return (
      <TableError
        errorMessage="Something went wrong while trying to fetch coupons."
        refetch={refetch}
      />
    );

  return (
    <CouponsTable
      columns={columns}
      data={coupons?.data || []}
      pagination={{
        limit: coupons?.meta?.limit ?? limit,
        current: coupons?.meta?.page ?? page,
        items: coupons?.meta?.total ?? 0,
        pages: coupons?.meta?.totalPages ?? 0,
        next: (coupons?.meta?.page ?? page) < (coupons?.meta?.totalPages ?? 0) ? (coupons?.meta?.page ?? page) + 1 : null,
        prev: (coupons?.meta?.page ?? page) > 1 ? (coupons?.meta?.page ?? page) - 1 : null,
      }}
      rowSelection={rowSelection}
      setRowSelection={setRowSelection}
    />
  );
}
