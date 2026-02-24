"use server";

import { revalidatePath } from "next/cache";
import { apiDelete } from "@/lib/api-server";
import { ServerActionResponse } from "@/types/server-action";
import { RatingsResponse } from "@/services/ratings/types";

export async function deleteRating(
    ratingId: string
): Promise<ServerActionResponse> {
    try {
        const response = await apiDelete<RatingsResponse>(`/api/ratings/${ratingId}`);

        if (!response.success) {
            return { dbError: response.error || "Failed to delete rating" };
        }

        revalidatePath("/reviews");
        return { success: true };
    } catch (error: any) {
        console.error("Delete rating failed:", error);
        return { dbError: "Failed to connect to server" };
    }
}
