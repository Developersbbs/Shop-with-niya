"use server";

import { revalidatePath } from "next/cache";
import { apiPatch } from "@/lib/api-server";
import { ServerActionResponse } from "@/types/server-action";
import { RatingsResponse } from "@/services/ratings/types";

export async function updateRatingStatus(
    ratingId: string,
    status: 'pending' | 'approved' | 'rejected'
): Promise<ServerActionResponse> {
    try {
        const response = await apiPatch<RatingsResponse>(`/api/ratings/${ratingId}/status`, { status });

        if (!response.success) {
            return { dbError: response.error || "Failed to update rating status" };
        }

        revalidatePath("/reviews");
        return { success: true };
    } catch (error: any) {
        console.error("Update rating status failed:", error);
        return { dbError: "Failed to connect to server" };
    }
}
