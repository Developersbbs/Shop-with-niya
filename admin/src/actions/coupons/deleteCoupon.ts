"use server";

import { revalidatePath } from "next/cache";
import { ServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function deleteCoupon(
  couponId: string
): Promise<ServerActionResponse> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons/${couponId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      return {
        success: false,
        dbError: errorData.error || "Failed to delete coupon",
      };
    }

    // Revalidate the coupons page
    revalidatePath("/coupons");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteCoupon:", error);
    return {
      success: false,
      dbError: "An unexpected error occurred. Please try again.",
    };
  }
}
