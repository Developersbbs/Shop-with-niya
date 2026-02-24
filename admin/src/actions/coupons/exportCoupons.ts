"use server";
import { ApiResponse } from "@/types/api";

export async function exportCoupons() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons/export`);

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      return {
        error: errorData.message || "Failed to export coupons.",
      };
    }

    const data = await response.json();
    return { data: data.data };
  } catch (error) {
    console.error("Error in exportCoupons:", error);
    return {
      error: "Failed to fetch data for coupons."
    };
  }
}
