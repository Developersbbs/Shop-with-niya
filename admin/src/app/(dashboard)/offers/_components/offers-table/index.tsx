"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Offer } from "@/services/offers/offers";
import { SingleOfferActions } from "../OfferActions";

interface AllOffersProps {
  offers: Offer[];
  pagination: {
    pages: number;
    current: number;
    prev: number | null;
    next: number | null;
    limit: number;
    items: number;
  };
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

interface RowSelectionProps {
  rowSelection: Record<string, boolean>;
  setRowSelection: (selection: Record<string, boolean>) => void;
}

export default function AllOffers({
  offers,
  pagination,
  isLoading,
  isError,
  refetch,
}: AllOffersProps & RowSelectionProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const getOfferTypeLabel = (type: string) => {
    const labels = {
      bogo: "BOGO",
      flash: "Flash Sale",
      category_discount: "Category Discount",
      storewide: "Store-wide",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getOfferTypeColor = (type: string) => {
    const colors = {
      bogo: "bg-purple-100 text-purple-800",
      flash: "bg-orange-100 text-orange-800",
      category_discount: "bg-blue-100 text-blue-800",
      storewide: "bg-green-100 text-green-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      draft: "Draft",
      active: "Active",
      disabled: "Disabled",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      disabled: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 80) return "High";
    if (priority >= 40) return "Medium";
    return "Low";
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return "bg-red-100 text-red-800";
    if (priority >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getUsagePercentage = (offer: Offer) => {
    if (!offer.usage_limit) return 0;
    return Math.round((offer.used_count / offer.usage_limit) * 100);
  };

  const getUsageStatus = (offer: Offer) => {
    if (!offer.usage_limit) return { label: "Unlimited", color: "bg-gray-100 text-gray-800" };

    const percentage = getUsagePercentage(offer);

    if (percentage >= 100) return { label: "Exhausted", color: "bg-red-100 text-red-800" };
    if (percentage >= 80) return { label: "Near Limit", color: "bg-orange-100 text-orange-800" };
    if (percentage >= 30) return { label: "Low Usage", color: "bg-blue-100 text-blue-800" };
    return { label: "Available", color: "bg-green-100 text-green-800" };
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return "-";
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "-";
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const isExpired = (endDate: string | null | undefined) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const isScheduled = (startDate: string | null | undefined) => {
    if (!startDate) return false;
    return new Date(startDate) > new Date();
  };

  const columns: ColumnDef<Offer>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Offer Title",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <div className="font-medium truncate">{row.getValue("title")}</div>
          <div className="text-sm text-gray-500 truncate">/{row.original.slug}</div>
        </div>
      ),
    },
    {
      accessorKey: "offer_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("offer_type") as string;
        return (
          <Badge className={getOfferTypeColor(type)}>
            {getOfferTypeLabel(type)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const endDate = row.original.end_date;
        const startDate = row.original.start_date;

        let statusColor = getStatusColor(status);
        let statusLabel = getStatusLabel(status);

        if (status === "active") {
          if (isExpired(endDate)) {
            statusColor = "bg-gray-100 text-gray-800";
            statusLabel = "Expired";
          } else if (isScheduled(startDate)) {
            statusColor = "bg-blue-100 text-blue-800";
            statusLabel = "Scheduled";
          }
        }

        return (
          <Badge className={statusColor}>
            {statusLabel}
          </Badge>
        );
      },
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => {
        const date = row.getValue("start_date") as string;
        return (
          <div className="text-sm">
            {formatDate(date)}
          </div>
        );
      },
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => {
        const date = row.getValue("end_date") as string;
        const expired = isExpired(date);

        return (
          <div className={`text-sm ${expired ? "text-red-600 font-medium" : ""}`}>
            {formatDate(date)}
            {expired && " (Expired)"}
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as number;
        return (
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(priority)}>
              {getPriorityLabel(priority)}
            </Badge>
            <span className="text-sm text-gray-500">({priority})</span>
          </div>
        );
      },
    },
    {
      accessorKey: "used_count",
      header: "Usage",
      cell: ({ row }) => {
        const offer = row.original;
        const usageStatus = getUsageStatus(offer);
        const percentage = getUsagePercentage(offer);

        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={usageStatus.color}>
                {usageStatus.label}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              {offer.used_count} used
              {offer.usage_limit && ` / ${offer.usage_limit}`}
              {offer.usage_limit && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "analytics.views",
      header: "Views",
      cell: ({ row }) => {
        const views = row.original.analytics?.views || 0;
        return (
          <div className="text-sm">
            {views.toLocaleString()}
          </div>
        );
      },
    },
    {
      accessorKey: "analytics.applied_success",
      header: "Applied",
      cell: ({ row }) => {
        const applied = row.original.analytics?.applied_success || 0;
        return (
          <div className="text-sm">
            {applied.toLocaleString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const offer = row.original;

        return (
          <SingleOfferActions
            offer={offer}
            onView={() => { window.location.href = `/offers/${offer._id}`; }}
            onEdit={() => { window.location.href = `/offers/${offer._id}/edit`; }}
            onDuplicate={() => console.log("Duplicate offer:", offer._id)}
          />
        );
      },
    },
  ];

  const table = useReactTable({
    data: offers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  if (isLoading) {
    return <TableSkeleton perPage={pagination.limit} columns={columns} />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Something went wrong while trying to fetch offers.
          <Button variant="outline" size="sm" onClick={refetch} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-500">
          <h3 className="text-lg font-medium mb-2">No offers found</h3>
          <p className="text-sm mb-4">
            Get started by creating your first offer.
          </p>
          <Button onClick={() => window.location.href = "/offers/create"}>
            Create Offer
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s).
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Page</p>
            <p className="text-sm font-medium">
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Skeleton component for loading state
function TableSkeleton({ perPage, columns }: { perPage: number; columns: ColumnDef<Offer>[] }) {
  return (
    <Card>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>
                  <Skeleton className="h-8 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: perPage }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}