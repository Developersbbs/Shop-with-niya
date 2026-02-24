"use client";

import { useSearchParams } from "next/navigation";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import ReviewsTable from "./Table";
import { getColumns, skeletonColumns } from "./columns";
import TableSkeleton from "@/components/shared/table/TableSkeleton";
import TableError from "@/components/shared/table/TableError";

import { fetchRatings } from "@/services/ratings";

interface AllReviewsProps {
    rowSelection: any;
    setRowSelection: (selection: any) => void;
}

export default function AllReviews({
    rowSelection,
    setRowSelection,
}: AllReviewsProps) {
    const searchParams = useSearchParams();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    const {
        data: ratings,
        isLoading,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["reviews", page, limit, search, status],
        queryFn: () =>
            fetchRatings({ page, limit, search }),
        placeholderData: keepPreviousData,
    });

    const columns = getColumns();

    if (isLoading)
        return <TableSkeleton perPage={limit} columns={skeletonColumns} />;

    if (isError || !ratings)
        return (
            <TableError
                errorMessage="Something went wrong while trying to fetch reviews."
                refetch={refetch}
            />
        );

    return (
        <ReviewsTable
            columns={columns}
            data={ratings?.data || []}
            pagination={{
                pages: ratings?.pagination?.pages || 0,
                current: ratings?.pagination?.page || 1,
                prev: ratings?.pagination?.page > 1 ? ratings.pagination.page - 1 : null,
                next: ratings?.pagination?.page < ratings?.pagination?.pages ? ratings.pagination.page + 1 : null,
                limit: limit,
                items: ratings?.pagination?.total || 0,
            }}
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
        />
    );
}
