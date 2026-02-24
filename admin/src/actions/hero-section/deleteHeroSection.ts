"use server";

import { revalidatePath } from "next/cache";
import { apiGet, apiDelete, apiPut } from "@/lib/api-server";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";
import { storage } from "@/firebase/config";
import { ref, deleteObject } from "firebase/storage";

export async function deleteHeroSection(
  heroSectionId: string
): Promise<EnhancedServerActionResponse> {
  try {
    // First fetch hero section to check if it exists and get image info
    const heroSectionResponse = await apiGet<ApiResponse<any>>(`/api/hero-section/${heroSectionId}`);
    
    if (!heroSectionResponse.success) {
      console.error("Failed to fetch hero section for deletion:", heroSectionResponse.error);
      return {
        success: false,
        message: "Failed to fetch hero section",
        errors: {
          general: [heroSectionResponse.error || "Failed to fetch hero section for deletion"],
        },
      };
    }

    const heroSection = heroSectionResponse.data;

    // Delete the image from Firebase Storage if it's a Firebase URL
    if (heroSection.image && heroSection.image.includes("firebasestorage.app")) {
      try {
        const imageRef = ref(storage, heroSection.image);
        await deleteObject(imageRef);
        console.log("Successfully deleted image from Firebase Storage");
      } catch (deleteError) {
        console.warn("Failed to delete image from Firebase Storage:", deleteError);
        // Continue with deletion even if image deletion fails
      }
    }

    // Delete the hero section from the database
    const deleteResponse = await apiDelete<ApiResponse<any>>(`/api/hero-section/${heroSectionId}`);
    
    if (!deleteResponse.success) {
      console.error("Failed to delete hero section:", deleteResponse.error);
      return {
        success: false,
        message: deleteResponse.message || "Failed to delete hero section",
        errors: {
          general: [deleteResponse.error || deleteResponse.message || "Failed to delete hero section"],
        },
      };
    }

    // Reorganize orders - update all slides with order > deleted slide order
    if (heroSection.order !== undefined) {
      try {
        // Get all slides to update their orders
        const allSlidesResponse = await apiGet<ApiResponse<any[]>>('/api/hero-section/admin');
        
        if (allSlidesResponse.success && allSlidesResponse.data) {
          const slidesToUpdate = allSlidesResponse.data
            .filter((slide: any) => slide.order > heroSection.order)
            .sort((a: any, b: any) => a.order - b.order);

          // Update each slide's order (decrement by 1)
          for (const slide of slidesToUpdate) {
            await apiPut<ApiResponse<any>>(`/api/hero-section/${slide._id}`, {
              order: slide.order - 1
            });
          }
          
          console.log(`Reorganized orders for ${slidesToUpdate.length} slides after deletion`);
        }
      } catch (reorderError) {
        console.warn("Failed to reorganize orders after deletion:", reorderError);
        // Don't fail the deletion if reorganization fails
      }
    }

    // Revalidate the hero section page
    revalidatePath("/hero-section");

    return {
      success: true,
      message: "Hero section deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteHeroSection:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
