"use client";

import { useState, Fragment, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

// Import offers components
// Fixed import paths for OfferActions and OfferFilters
import AllOffers from "./offers-table";
import OfferActions from "./OfferActions";
import OfferFilters from "./OfferFilters";
import { fetchOffers } from "@/services/offers/offers";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Offers() {
  const searchParams = useSearchParams();
  const [rowSelection, setRowSelection] = useState({});

  // Parse URL parameters with better error handling
  const rawPage = searchParams.get("page");
  const rawLimit = searchParams.get("limit");
  const rawSearch = searchParams.get("search");
  const rawOfferType = searchParams.get("offerType");
  const rawStatus = searchParams.get("status");
  const rawPriority = searchParams.get("priority");
  const rawUsageThreshold = searchParams.get("usageThreshold");
  const rawSortBy = searchParams.get("sortBy");
  const rawOrder = searchParams.get("order");

  const page = rawPage && !isNaN(Number(rawPage)) ? Math.max(1, parseInt(rawPage)) : 1;
  const limit = rawLimit && !isNaN(Number(rawLimit)) ? Math.max(1, parseInt(rawLimit)) : 10;
  const search = rawSearch || "";
  const offerType = rawOfferType || "";
  const status = rawStatus || "";
  const priority = rawPriority || "";
  const usageThreshold = rawUsageThreshold || "";
  const sortBy = rawSortBy || "priority";
  const order = rawOrder || "desc";

  const [lastPage, setLastPage] = useState(page);

  if (page !== lastPage) {
    setLastPage(page);
    setRowSelection({});
  }

  // Create stable query key
  const queryKey = useMemo(() => [
    "offers",
    page,
    limit,
    search,
    offerType,
    status,
    priority,
    usageThreshold,
    sortBy,
    order
  ], [page, limit, search, offerType, status, priority, usageThreshold, sortBy, order]);

  // Fetch offers with filters
  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => fetchOffers({
      page,
      limit,
      search,
      offerType,
      status,
      priority,
      usageThreshold,
      sortBy,
      order
    }),
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: true,
    retry: 1,
    retryDelay: 1000,
  });

  // Show search results info
  const searchResultsInfo = search && data?.meta ? (
    <div className="mb-4 text-sm text-muted-foreground">
      Found {data.meta.total} result{data.meta.total !== 1 ? 's' : ''} for &quot;{search}&quot;
    </div>
  ) : null;

  return (
    <Fragment>
      <OfferActions
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        offers={data?.data || []}
      />
      <OfferFilters />

      {searchResultsInfo}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load offers: {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      ) : data && data.data.length === 0 ? (
        <Alert>
          <AlertDescription>
            {search
              ? `No offers found matching "${search}"`
              : "No offers available"
            }
          </AlertDescription>
        </Alert>
      ) : (
        <AllOffers
          rowSelection={rowSelection}
          setRowSelection={setRowSelection}
          offers={data?.data || []}
          pagination={{
            pages: data?.meta?.totalPages || 0,
            current: data?.meta?.page || 1,
            prev: data?.meta?.prev || null,
            next: data?.meta?.next || null,
            limit: data?.meta?.limit || 10,
            items: data?.meta?.total || 0,
          }}
          isLoading={isLoading}
          isError={isError}
          refetch={() => window.location.reload()}
        />
      )}
    </Fragment>
  );
}
