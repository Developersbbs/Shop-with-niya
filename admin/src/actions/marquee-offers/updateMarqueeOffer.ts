"use server";

import { revalidatePath } from "next/cache";
import { formatValidationErrors } from "@/helpers/formatValidationErrors";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function updateMarqueeOffer(
  marqueeOfferId: string,
  formData: FormData
): Promise<EnhancedServerActionResponse> {
  // Extract form data
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;
  const isActive = formData.get("isActive") === "true";

  // Validate required fields
  if (!title || title.trim() === '') {
    return {
      success: false,
      message: "Title is required",
      errors: {
        title: ["Title is required"],
      },
    };
  }

  if (!description || description.trim() === '') {
    return {
      success: false,
      message: "Description is required",
      errors: {
        description: ["Description is required"],
      },
    };
  }

  try {
    // First get the current offer to preserve its order
    const currentOfferResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marquee-offers/${marqueeOfferId}`);
    
    if (!currentOfferResponse.ok) {
      return {
        success: false,
        message: "Failed to fetch current marquee offer",
        errors: {
          general: ["Failed to fetch current marquee offer"],
        },
      };
    }

    const currentOfferData: ApiResponse<any> = await currentOfferResponse.json();
    
    if (!currentOfferData.success) {
      return {
        success: false,
        message: "Marquee offer not found",
        errors: {
          general: ["Marquee offer not found"],
        },
      };
    }

    // Prepare the API request body (preserve existing order)
    const requestBody = {
      title: title.trim(),
      description: description.trim(),
      icon: icon || '',
      order: currentOfferData.data.order, // Preserve existing order
      isActive: isActive !== undefined ? isActive : true,
    };

    // Make the API request to your backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marquee-offers/${marqueeOfferId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to update marquee offer",
        errors: errorData.error ? { general: [errorData.error] } : {},
      };
    }

    const data: ApiResponse<any> = await response.json();

    // Revalidate the marquee offers page
    revalidatePath("/marquee-offers");

    return {
      success: true,
      message: "Marquee offer updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Error in updateMarqueeOffer:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
