"use server";

import { serverAxiosInstance } from "@/helpers/axiosInstance";

export async function exportProducts() {
  try {
    const { data } = await serverAxiosInstance.get("/api/products/export/csv", {
      responseType: "text",   // ← expect CSV text, not JSON
    });

    return { data };          // data is now the raw CSV string

  } catch (error: any) {
    console.error("Products export error:", error);
    return {
      error: error.response?.data?.error || "Failed to fetch data for products."
    };
  }
}