"use server";

import { revalidatePath } from "next/cache";
import { ServerActionResponse } from "@/types/server-action";

export async function toggleCategoryPublishedStatus(
  categoryId: string,
  currentPublishedStatus: boolean
): Promise<ServerActionResponse> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !currentPublishedStatus }),
    });

    if (!res.ok) return { dbError: "Failed to update category status." };

    revalidatePath("/categories");
    return { success: true };
  } catch (err) {
    console.error("Error updating category:", err);
    return { dbError: "Something went wrong." };
  }
}
