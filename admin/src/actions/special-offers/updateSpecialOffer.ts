"use server";

import { revalidatePath } from "next/cache";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function updateSpecialOffer(
  specialOfferId: string,
  formData: FormData
): Promise<EnhancedServerActionResponse> {
  // Extract form data
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const icon = formData.get("icon") as string;
  const bgColor = formData.get("bgColor") as string;
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
    // Prepare the API request body
    const requestBody = {
      title: title.trim(),
      description: description.trim(),
      icon: icon || 'FaGift',
      bgColor: bgColor || 'from-rose-50 to-rose-100',
      isActive: isActive !== undefined ? isActive : true,
    };

    // Make the API request to your backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/special-offers/${specialOfferId}`, {
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
        message: errorData.message || "Failed to update special offer",
        errors: errorData.error ? { general: [errorData.error] } : {},
      };
    }

    const data: ApiResponse<Record<string, unknown>> = await response.json();

    // Revalidate the special offers page
    revalidatePath("/special-offers");

    return {
      success: true,
      message: "Special offer updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Error in updateSpecialOffer:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
