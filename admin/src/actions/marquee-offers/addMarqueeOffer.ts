"use server";

import { revalidatePath } from "next/cache";
import { formatValidationErrors } from "@/helpers/formatValidationErrors";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function addMarqueeOffer(
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
    // Get current offers to calculate next order
    const offersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marquee-offers/admin`);
    if (offersResponse.ok) {
      const offersData: ApiResponse<any[]> = await offersResponse.json();
      let nextOrder = 0;
      
      if (offersData.success && offersData.data && offersData.data.length > 0) {
        const highestOrder = Math.max(...offersData.data.map(o => o.order || 0));
        nextOrder = highestOrder + 1;
      }

      // Prepare the API request body
      const requestBody = {
        title: title.trim(),
        description: description.trim(),
        icon: icon || '',
        order: nextOrder,
        isActive: isActive !== undefined ? isActive : true,
      };

      // Make the API request to your backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marquee-offers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: ApiResponse<null> = await response.json();
        return {
          success: false,
          message: errorData.message || "Failed to create marquee offer",
          errors: errorData.error ? { general: [errorData.error] } : {},
        };
      }

      const data: ApiResponse<any> = await response.json();

      // Revalidate the marquee offers page
      revalidatePath("/marquee-offers");

      return {
        success: true,
        message: "Marquee offer created successfully",
        data: data.data,
      };
    } else {
      return {
        success: false,
        message: "Failed to fetch current offers for order calculation",
        errors: {
          general: ["Failed to fetch current offers"],
        },
      };
    }
  } catch (error) {
    console.error("Error in addMarqueeOffer:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
