"use server";

import { revalidatePath } from "next/cache";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function addComboOffer(
  formData: FormData
): Promise<EnhancedServerActionResponse> {
  // Extract form data
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const originalPrice = formData.get("originalPrice") as string;
  const isLimitedTime = formData.get("isLimitedTime") === "true";
  const isActive = formData.get("isActive") === "true";
  const badgeType = formData.get("badgeType") as string || "LIMITED_TIME";
  const showOnHomepage = formData.get("showOnHomepage") === "true";
  const showOnOffersPage = formData.get("showOnOffersPage") === "true";
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const displayPriority = formData.get("displayPriority") as string;
  const comboImage = formData.get("comboImage") as string;
  const productsStr = formData.get("products") as string;

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

  if (!price || parseFloat(price) < 0) {
    return {
      success: false,
      message: "Valid price is required",
      errors: {
        price: ["Valid price is required"],
      },
    };
  }

  if (!originalPrice || parseFloat(originalPrice) < 0) {
    return {
      success: false,
      message: "Valid original price is required",
      errors: {
        originalPrice: ["Valid original price is required"],
      },
    };
  }

  const priceNum = parseFloat(price);
  const originalPriceNum = parseFloat(originalPrice);

  if (priceNum > originalPriceNum) {
    return {
      success: false,
      message: "Discounted price cannot be greater than original price",
      errors: {
        price: ["Discounted price cannot be greater than original price"],
      },
    };
  }

  // Parse products
  let products = [];
  if (productsStr) {
    try {
      products = JSON.parse(productsStr);
    } catch {
      return {
        success: false,
        message: "Invalid products data",
        errors: {
          products: ["Invalid products data"],
        },
      };
    }
  }

  if (!products || products.length === 0) {
    return {
      success: false,
      message: "At least one product must be included in the combo",
      errors: {
        products: ["At least one product must be included in the combo"],
      },
    };
  }

  try {
    // Get current offers to calculate next order
    const offersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/combo-offers/admin`);
    if (offersResponse.ok) {
      const offersData: ApiResponse<{ order?: number }[]> = await offersResponse.json();
      let nextOrder = 0;

      if (offersData.success && offersData.data && offersData.data.length > 0) {
        const highestOrder = Math.max(...offersData.data.map(o => o.order || 0));
        nextOrder = highestOrder + 1;
      }

      // Prepare the API request body
      const requestBody = {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        originalPrice: originalPriceNum,
        isLimitedTime: isLimitedTime !== undefined ? isLimitedTime : true,
        order: nextOrder,
        isActive: isActive !== undefined ? isActive : true,
        badgeType: badgeType,
        showOnHomepage: showOnHomepage !== undefined ? showOnHomepage : true,
        showOnOffersPage: showOnOffersPage !== undefined ? showOnOffersPage : true,
        startDate: startDate || null,
        endDate: endDate || null,
        displayPriority: displayPriority ? parseInt(displayPriority) : 0,
        comboImage: comboImage || null,
        products: products
      };

      // Make the API request to your backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/combo-offers`, {
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
          message: errorData.message || "Failed to create combo offer",
          errors: errorData.error ? { general: [errorData.error] } : {},
        };
      }

      const data: ApiResponse<unknown> = await response.json();

      // Revalidate the combo offers page
      revalidatePath("/combo-offers");

      return {
        success: true,
        message: "Combo offer created successfully",
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
    console.error("Error in addComboOffer:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
