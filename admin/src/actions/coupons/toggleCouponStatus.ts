"use server";

import { revalidatePath } from "next/cache";
import { ServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function toggleCouponPublishedStatus(
  couponId: string,
  currentPublishedStatus: boolean
): Promise<ServerActionResponse> {
  try {
    const newPublishedStatus = !currentPublishedStatus;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons/${couponId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_active: true, // Required field - keep the coupon active
        published: newPublishedStatus,
      }),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      return {
        success: false,
        dbError: errorData.error || "Failed to update coupon status",
      };
    }

    // Revalidate the coupons page
    revalidatePath("/coupons");

    return { success: true };
  } catch (error) {
    console.error("Error in toggleCouponPublishedStatus:", error);
    return {
      success: false,
      dbError: "An unexpected error occurred. Please try again.",
    };
  }
}
