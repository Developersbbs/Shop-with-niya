"use client";

import { Trash2, Check, X } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import Typography from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

import { TooltipWrapper } from "@/components/shared/table/TableActionTooltip";
import { TableActionAlertDialog } from "@/components/shared/table/TableActionAlertDialog";
import { Rating } from "@/services/ratings/types";
import { deleteRating } from "@/actions/ratings/deleteRating";
import { updateRatingStatus } from "@/actions/ratings/updateRatingStatus";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";

// Helper to render stars
const renderStars = (rating: number) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <span
                    key={star}
                    className={`text-sm ${star <= rating ? "text-yellow-400" : "text-gray-300"
                        }`}
                >
                    ★
                </span>
            ))}
        </div>
    );
};

export const useReviewsColumns = () => {
    const queryClient = useQueryClient();

    const columns: ColumnDef<Rating>[] = [
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
        },
        {
            header: "Product",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.product_id?.image_url && row.original.product_id.image_url.length > 0 ? (
                        <ImagePlaceholder
                            src={row.original.product_id.image_url[0]}
                            alt={row.original.product_id?.name || "Product"}
                            width={32}
                            height={32}
                            className="size-8 rounded object-cover"
                        />
                    ) : (
                        <div className="size-8 bg-gray-200 rounded"></div>
                    )}
                    <div className="flex flex-col" title={row.original.product_id?.name}>
                        <Typography className="font-medium text-sm truncate max-w-[150px]">
                            {row.original.product_id?.name || "Unknown Product"}
                        </Typography>
                    </div>
                </div>
            )
        },
        {
            header: "Customer",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <Typography className="font-medium text-sm">
                        {row.original.customer_id?.name || "Anonymous"}
                    </Typography>
                    <Typography className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {row.original.customer_id?.email}
                    </Typography>
                </div>
            ),
        },
        {
            header: "Rating",
            cell: ({ row }) => (
                <div className="flex flex-col gap-1" title={row.original.review}>
                    {renderStars(row.original.rating)}
                    <Typography className="text-sm line-clamp-2 max-w-[200px]">
                        {row.original.review || <span className="text-gray-400 italic">No review text</span>}
                    </Typography>
                </div>
            ),
        },
        {
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                const color = status === 'approved' ? 'bg-green-100 text-green-800' :
                    status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
                return (
                    <Badge variant="secondary" className={color}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                );
            },
        },
        {
            header: "Date",
            cell: ({ row }) => (
                <Typography className="text-sm text-gray-500">
                    {new Date(row.original.created_at).toLocaleDateString()}
                </Typography>
            ),
        },

        {
            header: "Actions",
            cell: ({ row }) => {

                const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
                    const result = await updateRatingStatus(row.original._id, newStatus);

                    if ("success" in result && result.success) {
                        toast.success(`Review ${newStatus} successfully`);
                        queryClient.invalidateQueries({ queryKey: ["reviews"] });
                    } else if ("dbError" in result) {
                        toast.error(result.dbError || "Failed to update status");
                    } else {
                        toast.error("An unexpected error occurred");
                    }
                };

                return (
                    <div className="flex items-center gap-2">
                        {/* Status Actions */}
                        {row.original.status !== 'approved' && (
                            <TooltipWrapper content="Approve">
                                <button
                                    onClick={() => handleStatusUpdate('approved')}
                                    className="p-1 hover:bg-green-100 rounded text-green-600"
                                >
                                    <Check className="size-4" />
                                </button>
                            </TooltipWrapper>
                        )}

                        {row.original.status !== 'rejected' && (
                            <TooltipWrapper content="Reject">
                                <button
                                    onClick={() => handleStatusUpdate('rejected')}
                                    className="p-1 hover:bg-red-100 rounded text-red-600"
                                >
                                    <X className="size-4" />
                                </button>
                            </TooltipWrapper>
                        )}

                        <TableActionAlertDialog
                            title="Delete Review?"
                            description="This action cannot be undone."
                            tooltipContent="Delete Review"
                            actionButtonText="Delete"
                            toastSuccessMessage="Review deleted successfully!"
                            queryKey="reviews" // Invalidate query key used in reviews-table/index.tsx
                            action={() => deleteRating(row.original._id)}
                        >
                            <Trash2 className="size-4" />
                        </TableActionAlertDialog>
                    </div>
                );
            },
        },
    ];

    return columns;
};

export const skeletonColumns = [
    {
        header: <Checkbox disabled checked={false} />,
        cell: <Skeleton className="size-4 rounded-sm" />,
    },
    {
        header: "Product",
        cell: <Skeleton className="w-24 h-8" />,
    },
    {
        header: "Customer",
        cell: <Skeleton className="w-24 h-8" />,
    },
    {
        header: "Rating",
        cell: <Skeleton className="w-32 h-12" />,
    },
    {
        header: "Status",
        cell: <Skeleton className="w-16 h-6" />,
    },
    {
        header: "Date",
        cell: <Skeleton className="w-20 h-6" />,
    },
    {
        header: "Actions",
        cell: <Skeleton className="w-20 h-8" />,
    },
];
