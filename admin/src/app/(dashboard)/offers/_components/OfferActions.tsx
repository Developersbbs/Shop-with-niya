"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Power, PowerOff, Trash2, Edit, Copy, Eye, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ExportDataButtons } from "@/components/shared/ExportDataButtons";

import { Offer } from "@/services/offers/offers";
import { bulkUpdateOffers, deleteOffer, toggleOfferStatus, exportOffersCSV } from "@/services/offers/offers";
import OfferFormSheet from "./form/OfferFormSheet";
// import { useAuthorization } from "@/hooks/use-authorization"; // Uncomment if you have authorization

interface OfferActionsProps {
  rowSelection: Record<string, boolean>;
  setRowSelection: (selection: Record<string, boolean>) => void;
  offers: Offer[];
}

export default function OfferActions({ 
  rowSelection, 
  setRowSelection, 
  offers 
}: OfferActionsProps) {
  const router = useRouter();
  // const { hasPermission } = useAuthorization(); // Uncomment if you have authorization
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const selectedOffers = Object.keys(rowSelection).filter(id => rowSelection[id]);
  const selectedCount = selectedOffers.length;

  const handleBulkActivate = async () => {
    if (selectedCount === 0) {
      toast.error("Please select offers to activate");
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const result = await bulkUpdateOffers({
        ids: selectedOffers,
        action: "activate"
      });

      if (result.success) {
        toast.success(result.message);
        setRowSelection({});
        router.refresh();
      } else {
        toast.error("Failed to activate offers");
      }
    } catch (error) {
      console.error("Bulk activate error:", error);
      toast.error("Failed to activate offers");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedCount === 0) {
      toast.error("Please select offers to deactivate");
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const result = await bulkUpdateOffers({
        ids: selectedOffers,
        action: "deactivate"
      });

      if (result.success) {
        toast.success(result.message);
        setRowSelection({});
        router.refresh();
      } else {
        toast.error("Failed to deactivate offers");
      }
    } catch (error) {
      console.error("Bulk deactivate error:", error);
      toast.error("Failed to deactivate offers");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCount === 0) {
      toast.error("Please select offers to delete");
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const result = await bulkUpdateOffers({
        ids: selectedOffers,
        action: "delete"
      });

      if (result.success) {
        toast.success(result.message);
        setRowSelection({});
        router.refresh();
      } else {
        toast.error("Failed to delete offers");
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete offers");
    } finally {
      setIsBulkActionLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleBulkPriority = async (priority: number) => {
    if (selectedCount === 0) {
      toast.error("Please select offers to update priority");
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const result = await bulkUpdateOffers({
        ids: selectedOffers,
        action: "priority",
        data: { priority }
      });

      if (result.success) {
        toast.success(result.message);
        setRowSelection({});
        router.refresh();
      } else {
        toast.error("Failed to update priority");
      }
    } catch (error) {
      console.error("Bulk priority error:", error);
      toast.error("Failed to update priority");
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleCreateOffer = () => {
    router.push("/offers/create");
  };

  const getSelectedOffersStatus = () => {
    if (selectedCount === 0) return null;
    
    const selectedOffersData = offers.filter(offer => selectedOffers.includes(offer._id));
    const activeCount = selectedOffersData.filter(offer => offer.status === "active").length;
    const draftCount = selectedOffersData.filter(offer => offer.status === "draft").length;
    const disabledCount = selectedOffersData.filter(offer => offer.status === "disabled").length;

    return { activeCount, draftCount, disabledCount };
  };

  const selectedStatus = getSelectedOffersStatus();

  // If you have authorization, uncomment these lines and wrap conditions below
  // const canEdit = hasPermission("offers", "canEdit");
  // const canDelete = hasPermission("offers", "canDelete");
  // const canCreate = hasPermission("offers", "canCreate");

  return (
    <Card className="mb-5">
      <form className="flex flex-col xl:flex-row xl:justify-between gap-4">
        {/* Left side - Export buttons */}
        <div className="flex items-center gap-4">
          <ExportDataButtons action={exportOffersCSV} tableName="offers" />
          
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                {selectedCount} selected
              </Badge>

              {selectedStatus && (
                <div className="hidden lg:flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="text-green-600">{selectedStatus.activeCount} active</span>
                  <span>•</span>
                  <span className="text-blue-600">{selectedStatus.draftCount} draft</span>
                  <span>•</span>
                  <span className="text-red-600">{selectedStatus.disabledCount} disabled</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side - Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Bulk Actions Dropdown - Only show when items are selected */}
          {selectedCount > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  type="button"
                  disabled={isBulkActionLoading}
                  className="sm:flex-grow xl:flex-grow-0 transition-opacity duration-300"
                >
                  <MoreHorizontal className="mr-2 size-4" />
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleBulkActivate} disabled={isBulkActionLoading}>
                  <Power className="h-4 w-4 mr-2 text-green-600" />
                  Activate Selected
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBulkDeactivate} disabled={isBulkActionLoading}>
                  <PowerOff className="h-4 w-4 mr-2 text-orange-600" />
                  Deactivate Selected
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <DropdownMenuItem>
                      Set Priority
                    </DropdownMenuItem>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBulkPriority(90)}>
                      High Priority (90)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkPriority(50)}>
                      Medium Priority (50)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkPriority(10)}>
                      Low Priority (10)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteDialogOpen(true)} 
                  className="text-red-600"
                  disabled={isBulkActionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Delete Button - Only show when items are selected */}
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="lg"
              type="button"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isBulkActionLoading}
              className="sm:flex-grow xl:flex-grow-0 transition-opacity duration-300"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          )}

          {/* Add Offer Button - Always visible */}
          <OfferFormSheet
            title="Create New Offer"
            description="Create a new promotional offer for your store"
            submitButtonText="Create Offer"
            actionVerb="created"
          >
            <SheetTrigger asChild>
              <Button
                variant="default"
                size="lg"
                type="button"
                className="sm:flex-grow xl:flex-grow-0"
              >
                <Plus className="mr-2 size-4" />
                Add Offer
              </Button>
            </SheetTrigger>
          </OfferFormSheet>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} offer{selectedCount > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the offer{selectedCount > 1 ? 's' : ''} and {selectedCount > 1 ? 'their' : 'its'} associated data from the database.
              {selectedStatus && (
                <div className="mt-3 text-sm">
                  This includes:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {selectedStatus.activeCount > 0 && (
                      <li className="text-green-600">{selectedStatus.activeCount} active offer{selectedStatus.activeCount > 1 ? 's' : ''}</li>
                    )}
                    {selectedStatus.draftCount > 0 && (
                      <li className="text-blue-600">{selectedStatus.draftCount} draft offer{selectedStatus.draftCount > 1 ? 's' : ''}</li>
                    )}
                    {selectedStatus.disabledCount > 0 && (
                      <li className="text-red-600">{selectedStatus.disabledCount} disabled offer{selectedStatus.disabledCount > 1 ? 's' : ''}</li>
                    )}
                  </ul>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete} 
              disabled={isBulkActionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isBulkActionLoading ? "Deleting..." : "Delete Offers"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// Individual Offer Actions Component
interface SingleOfferActionsProps {
  offer: Offer;
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
}

export function SingleOfferActions({ 
  offer, 
  onEdit, 
  onView, 
  onDuplicate, 
  onDelete, 
  onToggleStatus 
}: SingleOfferActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      const result = await toggleOfferStatus(offer._id);
      if (result.success) {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error("Failed to toggle offer status");
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      toast.error("Failed to toggle offer status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteOffer(offer._id);
      if (result.success) {
        toast.success(result.message);
        window.location.reload();
      } else {
        toast.error("Failed to delete offer");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete offer");
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const isActive = offer.status === "active";

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setDeleteDialogOpen(true)}
        className="text-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete offer "{offer.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the offer and all associated data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete Offer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}