"use server";

import { revalidatePath } from "next/cache";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function toggleOfferPopup(
  id: string
): Promise<EnhancedServerActionResponse> {
  try {
    // Make the API request to your backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offer-popups/${id}/toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to toggle offer popup",
        errors: errorData.error ? { general: [errorData.error] } : {},
      };
    }

    const data: ApiResponse<any> = await response.json();

    // Revalidate the offer-popups page
    revalidatePath("/offer-popups");

    return {
      success: true,
      message: "Offer popup status updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Error in toggleOfferPopup:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
