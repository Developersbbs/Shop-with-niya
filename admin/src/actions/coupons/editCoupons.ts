"use server";

import { revalidatePath } from "next/cache";
import { couponBulkFormSchema } from "@/app/(dashboard)/coupons/_components/form/schema";
import { formatValidationErrors } from "@/helpers/formatValidationErrors";
import { VServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";

export async function editCoupons(
  couponIds: string[],
  formData: FormData
): Promise<VServerActionResponse> {
  const parsedData = couponBulkFormSchema.safeParse({
    published: !!(formData.get("published") === "true"),
  });

  if (!parsedData.success) {
    return {
      validationErrors: formatValidationErrors(
        parsedData.error.flatten().fieldErrors
      ),
    };
  }

  const { published } = parsedData.data;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons/bulk`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: couponIds,
        published,
      }),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      return {
        success: false,
        dbError: errorData.error || "Failed to update coupons",
      };
    }

    // Revalidate the coupons page
    revalidatePath("/coupons");

    return { success: true };
  } catch (error) {
    console.error("Error in editCoupons:", error);
    return {
      success: false,
      dbError: "An unexpected error occurred. Please try again.",
    };
  }
}
