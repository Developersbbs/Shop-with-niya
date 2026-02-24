"use server";

import { revalidatePath } from "next/cache";
import { apiGet, apiDelete } from "@/lib/api-server";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function deleteMarqueeOffer(
  marqueeOfferId: string
): Promise<EnhancedServerActionResponse> {
  try {
    // First fetch marquee offer to check if it exists and get its order
    const marqueeOfferResponse = await apiGet<ApiResponse<any>>(`/api/marquee-offers/${marqueeOfferId}`);
    
    if (!marqueeOfferResponse.success) {
      console.error("Failed to fetch marquee offer for deletion:", marqueeOfferResponse.error);
      return {
        success: false,
        message: "Failed to fetch marquee offer",
        errors: {
          general: [marqueeOfferResponse.error || "Failed to fetch marquee offer for deletion"],
        },
      };
    }

    const marqueeOffer = marqueeOfferResponse.data;

    // Delete the marquee offer from the database
    const deleteResponse = await apiDelete<ApiResponse<any>>(`/api/marquee-offers/${marqueeOfferId}`);
    
    if (!deleteResponse.success) {
      console.error("Failed to delete marquee offer:", deleteResponse.error);
      return {
        success: false,
        message: deleteResponse.message || "Failed to delete marquee offer",
        errors: {
          general: [deleteResponse.error || deleteResponse.message || "Failed to delete marquee offer"],
        },
      };
    }

    // Reorganize orders - update all offers with order > deleted offer order
    if (marqueeOffer.order !== undefined) {
      try {
        // Get all offers to update their orders
        const allOffersResponse = await apiGet<ApiResponse<any[]>>('/api/marquee-offers/admin');
        
        if (allOffersResponse.success && allOffersResponse.data) {
          const offersToUpdate = allOffersResponse.data
            .filter((offer: any) => offer.order > marqueeOffer.order)
            .sort((a: any, b: any) => a.order - b.order);

          // Update each offer's order (decrement by 1)
          for (const offer of offersToUpdate) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marquee-offers/${offer._id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                order: offer.order - 1
              }),
            });
          }
          
          console.log(`Reorganized orders for ${offersToUpdate.length} marquee offers after deletion`);
        }
      } catch (reorderError) {
        console.warn("Failed to reorganize orders after deletion:", reorderError);
        // Don't fail the deletion if reorganization fails
      }
    }

    // Revalidate the marquee offers page
    revalidatePath("/marquee-offers");

    return {
      success: true,
      message: "Marquee offer deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteMarqueeOffer:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
