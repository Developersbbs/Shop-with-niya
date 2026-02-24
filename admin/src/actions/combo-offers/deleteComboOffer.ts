"use server";

import { revalidatePath } from "next/cache";
import { apiGet, apiDelete } from "@/lib/api-server";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function deleteComboOffer(
  comboOfferId: string
): Promise<EnhancedServerActionResponse> {
  try {
    // First fetch combo offer to check if it exists and get its order
    const comboOfferResponse = await apiGet<ApiResponse<any>>(`/api/combo-offers/${comboOfferId}`);
    
    if (!comboOfferResponse.success) {
      console.error("Failed to fetch combo offer for deletion:", comboOfferResponse.error);
      return {
        success: false,
        message: "Failed to fetch combo offer",
        errors: {
          general: [comboOfferResponse.error || "Failed to fetch combo offer for deletion"],
        },
      };
    }

    const comboOffer = comboOfferResponse.data;

    // Delete the combo offer from the database
    const deleteResponse = await apiDelete<ApiResponse<any>>(`/api/combo-offers/${comboOfferId}`);
    
    if (!deleteResponse.success) {
      console.error("Failed to delete combo offer:", deleteResponse.error);
      return {
        success: false,
        message: deleteResponse.message || "Failed to delete combo offer",
        errors: {
          general: [deleteResponse.error || deleteResponse.message || "Failed to delete combo offer"],
        },
      };
    }

    // Reorganize orders - update all offers with order > deleted offer order
    if (comboOffer.order !== undefined) {
      try {
        // Get all offers to update their orders
        const allOffersResponse = await apiGet<ApiResponse<any[]>>('/api/combo-offers/admin');
        
        if (allOffersResponse.success && allOffersResponse.data) {
          const offersToUpdate = allOffersResponse.data
            .filter((offer: any) => offer.order > comboOffer.order)
            .sort((a: any, b: any) => a.order - b.order);

          // Update each offer's order (decrement by 1)
          for (const offer of offersToUpdate) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/combo-offers/${offer._id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                order: offer.order - 1
              }),
            });
          }
          
          console.log(`Reorganized orders for ${offersToUpdate.length} combo offers after deletion`);
        }
      } catch (reorderError) {
        console.warn("Failed to reorganize orders after deletion:", reorderError);
        // Don't fail the deletion if reorganization fails
      }
    }

    // Revalidate the combo offers page
    revalidatePath("/combo-offers");

    return {
      success: true,
      message: "Combo offer deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteComboOffer:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
