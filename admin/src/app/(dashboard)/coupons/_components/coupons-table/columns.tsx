import { PenSquare, Trash2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import Typography from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

import { TableSwitch } from "@/components/shared/table/TableSwitch";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";
import { SheetTooltip } from "@/components/shared/table/TableActionTooltip";
import { TableActionAlertDialog } from "@/components/shared/table/TableActionAlertDialog";
import CouponFormSheet from "../form/CouponFormSheet";
import { CouponBadgeVariants } from "@/constants/badge";
import { SkeletonColumn } from "@/types/skeleton";
import { Coupon, CouponStatus } from "@/services/coupons/types";

import { editCoupon } from "@/actions/coupons/editCoupon";
import { deleteCoupon } from "@/actions/coupons/deleteCoupon";
import { toggleCouponPublishedStatus } from "@/actions/coupons/toggleCouponStatus";
import { HasPermission } from "@/hooks/use-authorization";

export const getColumns = ({
  hasPermission,
}: {
  hasPermission: HasPermission;
}) => {
  const columns: ColumnDef<Coupon>[] = [
    {
      header: "campaign name",
      cell: ({ row }) => (
        <div className="flex gap-2 items-center">
          <ImagePlaceholder
            src={row.original?.image_url || null}
            alt={row.original?.campaign_name || 'Coupon'}
            width={32}
            height={32}
            className="size-8 rounded-full"
          />

          <Typography className="capitalize block truncate">
            {row.original?.campaign_name || 'N/A'}
          </Typography>
        </div>
      ),
    },
    {
      header: "code",
      cell: ({ row }) => (
        <Typography className="uppercase">{row.original?.code}</Typography>
      ),
    },
    {
      header: "start date",
      cell: ({ row }) => row.original?.start_date ? format(new Date(row.original.start_date), "PP") : 'N/A',
    },
    {
      header: "end date",
      cell: ({ row }) => row.original?.end_date ? format(new Date(row.original.end_date), "PP") : 'N/A',
    },
    {
      header: "status",
      cell: ({ row }) => {
        if (!row.original?.end_date) {
          return (
            <Badge
              variant={CouponBadgeVariants.active}
              className="flex-shrink-0 text-xs capitalize"
            >
              Active
            </Badge>
          );
        }

        const currentTime = new Date();
        const endTime = new Date(row.original.end_date);

        const status: CouponStatus =
          currentTime > endTime ? "expired" : "active";

        return (
          <Badge
            variant={CouponBadgeVariants[status]}
            className="flex-shrink-0 text-xs capitalize"
          >
            {status}
          </Badge>
        );
      },
    },
  ];

  if (hasPermission("coupons", "canTogglePublished")) {
    columns.splice(3, 0, {
      header: "published",
      cell: ({ row }) => (
        <div className="pl-5">
          <TableSwitch
            checked={row.original?.published || false}
            toastSuccessMessage="Coupon status updated successfully."
            queryKey="coupons"
            onCheckedChange={() =>
              toggleCouponPublishedStatus(
                row.original?._id || '',
                row.original?.published || false
              )
            }
          />
        </div>
      ),
    });
  }

  if (
    hasPermission("coupons", "canDelete") ||
    hasPermission("coupons", "canEdit")
  ) {
    columns.splice(0, 0, {
      id: "select",
      header: ({ table }) => {
        // Safe access to table methods with fallbacks
        let isAllSelected = false;
        let isSomeSelected = false;
        
        try {
          isAllSelected = table?.getIsAllPageRowsSelected?.() || false;
          isSomeSelected = table?.getIsSomePageRowsSelected?.() || false;
        } catch (error) {
          console.warn("Error accessing table selection state:", error);
        }

        return (
          <Checkbox
            checked={isAllSelected || (isSomeSelected && "indeterminate")}
            onCheckedChange={(value) => {
              try {
                table?.toggleAllPageRowsSelected?.(!!value);
              } catch (error) {
                console.warn("Error toggling all rows selection:", error);
              }
            }}
            aria-label="Select all"
          />
        );
      },
      cell: ({ row }) => {
        // Safe access to row selection methods
        let isSelected = false;
        
        try {
          isSelected = row?.getIsSelected?.() || false;
        } catch (error) {
          console.warn("Error getting row selection state:", error);
        }

        return (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(value) => {
              try {
                row?.toggleSelected?.(!!value);
              } catch (error) {
                console.warn("Error toggling row selection:", error);
              }
            }}
            aria-label="Select row"
          />
        );
      },
    });

    columns.splice(8, 0, {
      header: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            {hasPermission("coupons", "canEdit") && (
              <CouponFormSheet
                key={row.original?._id}
                title="Update Coupon"
                description="Update necessary coupon information here"
                submitButtonText="Update Coupon"
                actionVerb="updated"
                initialData={{
                  ...(() => {
                    const data = {
                      campaignName: row.original?.campaign_name || '',
                      code: row.original?.code || '',
                      description: row.original?.description || '',
                      image: row.original?.image_url || undefined,
                      discountType: row.original?.discount_type || 'percentage',
                      discountValue: row.original?.discount_value || 0,
                      cashbackAmount: row.original?.cashback_amount || 0,
                      minPurchase: row.original?.min_purchase || 0,
                      maxDiscount: row.original?.max_discount || undefined,
                      usageLimit: row.original?.usage_limit || undefined,
                      limitPerUser: row.original?.limit_per_user || undefined,
                      startDate: row.original?.start_date ? new Date(row.original.start_date) : new Date(),
                      endDate: row.original?.end_date ? new Date(row.original.end_date) : new Date(),
                      isActive: row.original?.is_active ?? true,
                      published: row.original?.published ?? false,
                      autoApply: (row.original as any)?.auto_apply ?? false,
                      firstOrderOnly: (row.original as any)?.first_order_only ?? false,
                      newUserOnly: (row.original as any)?.new_user_only ?? false,
                      priority: row.original?.priority || 0,
                      applicableCategories: ((row.original?.applicable_categories || []) as any[]).map((cat: any) => {
                        console.log('Table - Mapping applicable category:', cat);
                        if (typeof cat === 'string') {
                          return { categoryId: cat, subcategoryIds: [], subcategoryNames: [], categoryName: undefined };
                        }
                        if (cat && typeof cat === 'object' && 'category' in cat) {
                          const mapped = { 
                            categoryId: cat.category, 
                            subcategoryIds: cat.subcategories || [], 
                            subcategoryNames: [], 
                            categoryName: undefined 
                          };
                          console.log('Table - Mapped category object:', mapped);
                          return mapped;
                        }
                        return { categoryId: cat._id || cat.categoryId || cat, subcategoryIds: [], subcategoryNames: [], categoryName: undefined };
                      }),
                      applicableProducts: (((row.original as any)?.applied_products || []).map((item: any) => 
                        typeof item === 'string' ? item : item.$oid || item.toString()
                      )),
                      applicableVariants: (((row.original as any)?.applied_variants || []).map((item: any) => 
                        typeof item === 'string' ? item : item.$oid || item.toString()
                      )),
                      applicableUsers: row.original?.applicable_users || [],
                      excludedCategories: ((row.original?.excluded_categories || []) as any[]).map((cat: any) => {
                        if (typeof cat === 'string') {
                          return { categoryId: cat, subcategoryIds: [], subcategoryNames: [], categoryName: undefined };
                        }
                        if (cat && typeof cat === 'object' && 'category' in cat) {
                          return { 
                            categoryId: cat.category, 
                            subcategoryIds: cat.subcategories || [], 
                            subcategoryNames: [], 
                            categoryName: undefined 
                          };
                        }
                        return { categoryId: cat._id || cat.categoryId || cat, subcategoryIds: [], subcategoryNames: [], categoryName: undefined };
                      }),
                      excludedProducts: (((row.original as any)?.excluded_products || []).map((item: any) => 
                        typeof item === 'string' ? item : item.$oid || item.toString()
                      )),
                      excludedVariants: (((row.original as any)?.excluded_variants || []).map((item: any) => 
                        typeof item === 'string' ? item : item.$oid || item.toString()
                      )),
                      visibilityOptions: {
                        showOnCheckout: row.original?.visibility_options?.show_on_checkout ?? true,
                        showOnHomepage: row.original?.visibility_options?.show_on_homepage ?? false,
                        showOnProductPage: row.original?.visibility_options?.show_on_product_page ?? false,
                        showInCart: row.original?.visibility_options?.show_in_cart ?? true,
                      },
                      bogoConfig: row.original?.bogo_config ? {
                        buyQuantity: row.original.bogo_config.buy_quantity || 1,
                        getQuantity: row.original.bogo_config.get_quantity || 1,
                        buyProducts: row.original.bogo_config.buy_products || [],
                        getProducts: row.original.bogo_config.get_products || [],
                        buyCategories: row.original.bogo_config.buy_categories || [],
                        getCategories: row.original.bogo_config.get_categories || [],
                      } : undefined,
                    };
                    console.log('Table - Passing initialData to form:', data);
                    return data;
                  })()
                }}
                action={(data) => {
                  console.log('Edit coupon data:', data);
                  return editCoupon(row.original?._id || '', data);
                }}
                previewImage={row.original?.image_url || ''}
              >
                <SheetTooltip content="Edit Coupon">
                  <PenSquare className="size-5" />
                </SheetTooltip>
              </CouponFormSheet>
            )}

            {hasPermission("coupons", "canDelete") && (
              <TableActionAlertDialog
                title={`Delete ${row.original?.campaign_name}?`}
                description="This action cannot be undone. This will permanently delete the coupon and its associated data from the database."
                tooltipContent="Delete Coupon"
                actionButtonText="Delete Coupon"
                toastSuccessMessage={`Coupon "${row.original?.campaign_name}" deleted successfully!`}
                queryKey="coupons"
                action={() => deleteCoupon(row.original?._id)}
              >
                <Trash2 className="size-5" />
              </TableActionAlertDialog>
            )}
          </div>
        );
      },
    });
  }

  return columns;
};

export const skeletonColumns: SkeletonColumn[] = [
  {
    header: <Checkbox disabled checked={false} />,
    cell: <Skeleton className="size-4 rounded-sm" />,
  },
  {
    header: "campaign name",
    cell: (
      <div className="flex gap-2 items-center">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="w-28 h-8" />
      </div>
    ),
  },
  {
    header: "code",
    cell: <Skeleton className="w-20 h-8" />,
  },
  
  {
    header: "published",
    cell: <Skeleton className="w-16 h-10" />,
  },
  {
    header: "start date",
    cell: <Skeleton className="w-20 h-8" />,
  },
  {
    header: "end date",
    cell: <Skeleton className="w-20 h-8" />,
  },
  {
    header: "status",
    cell: <Skeleton className="w-20 h-10" />,
  },
  {
    header: "actions",
    cell: <Skeleton className="w-20 h-8" />,
  },
];