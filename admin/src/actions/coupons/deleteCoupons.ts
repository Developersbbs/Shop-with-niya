"use server";

import { revalidatePath } from "next/cache";
import { ServerActionResponse } from "@/types/server-action";
import { apiDelete } from "@/lib/api-server";

export async function deleteCoupons(
  couponIds: string[]
): Promise<ServerActionResponse> {
  try {
    const response = await apiDelete<{ success: boolean; message: string; deletedCount?: number }>(
      "/api/coupons",
      {},
      { ids: couponIds }
    );

    if (!response.success) {
      return {
        success: false,
        dbError: "Failed to delete coupons",
      };
    }

    // Revalidate the coupons page
    revalidatePath("/coupons");

    return { success: true };
  } catch (error) {
    console.error("Error in deleteCoupons:", error);
    return {
      success: false,
      dbError: "An unexpected error occurred. Please try again.",
    };
  }
}
