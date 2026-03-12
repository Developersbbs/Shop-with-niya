"use server";

import { revalidatePath } from "next/cache";
import { apiGet, apiDelete } from "@/lib/api-server";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function deleteSpecialOffer(
  specialOfferId: string
): Promise<EnhancedServerActionResponse> {
  try {
    // First fetch special offer to check if it exists and get its order
    const specialOfferResponse = await apiGet<ApiResponse<{ order: number }>>(`/api/special-offers/${specialOfferId}`);

    if (!specialOfferResponse.success || !specialOfferResponse.data) {
      console.error("Failed to fetch special offer for deletion:", specialOfferResponse.error);
      return {
        success: false,
        message: "Failed to fetch special offer",
        errors: {
          general: [specialOfferResponse.error || "Failed to fetch special offer for deletion"],
        },
      };
    }

    const specialOffer = specialOfferResponse.data;

    // Delete the special offer from the database
    const deleteResponse = await apiDelete<ApiResponse<void>>(`/api/special-offers/${specialOfferId}`);

    if (!deleteResponse.success) {
      console.error("Failed to delete special offer:", deleteResponse.error);
      return {
        success: false,
        message: deleteResponse.message || "Failed to delete special offer",
        errors: {
          general: [deleteResponse.error || deleteResponse.message || "Failed to delete special offer"],
        },
      };
    }

    // Reorganize orders - update all offers with order > deleted offer order
    if (specialOffer.order !== undefined) {
      try {
        // Get all offers to update their orders
        const allOffersResponse = await apiGet<ApiResponse<{ _id: string, order: number }[]>>('/api/special-offers/admin');

        if (allOffersResponse.success && allOffersResponse.data) {
          const offersToUpdate = allOffersResponse.data
            .filter((offer: { _id: string, order: number }) => offer.order > (specialOffer.order as number))
            .sort((a: { _id: string, order: number }, b: { _id: string, order: number }) => a.order - b.order);

          // Update each offer's order (decrement by 1)
          for (const offer of offersToUpdate) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-offers/${offer._id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                order: offer.order - 1
              }),
            });
          }

          console.log(`Reorganized orders for ${offersToUpdate.length} offers after deletion`);
        }
      } catch (reorderError) {
        console.warn("Failed to reorganize orders after deletion:", reorderError);
        // Don't fail the deletion if reorganization fails
      }
    }

    // Revalidate the special offers page
    revalidatePath("/special-offers");

    return {
      success: true,
      message: "Special offer deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteSpecialOffer:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
