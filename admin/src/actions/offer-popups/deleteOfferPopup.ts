"use server";

import { revalidatePath } from "next/cache";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";
import { storage } from "@/firebase/config";
import { ref, deleteObject } from "firebase/storage";

export async function deleteOfferPopup(
  id: string
): Promise<EnhancedServerActionResponse> {
  try {
    // First, get the popup to find the image URL
    const getResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offer-popups/${id}`);
    
    if (!getResponse.ok) {
      return {
        success: false,
        message: "Offer popup not found",
        errors: {
          general: ["Offer popup not found"],
        },
      };
    }

    const getData: ApiResponse<any> = await getResponse.json();
    const popup = getData.data;

    // Delete the image from Firebase Storage if it exists
    if (popup.image) {
      try {
        // Extract the file path from the Firebase Storage URL
        const imageUrl = popup.image;
        const baseUrl = "https://firebasestorage.googleapis.com/v0/b/";
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        
        if (imageUrl.includes(baseUrl) && imageUrl.includes(projectId)) {
          // Extract the path from the URL
          const urlParts = imageUrl.split('/o/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split('?')[0];
            const decodedPath = decodeURIComponent(filePath);
            const storageRef = ref(storage, decodedPath);
            
            await deleteObject(storageRef);
          }
        }
      } catch (deleteError) {
        console.error("Error deleting image from Firebase Storage:", deleteError);
        // Continue with the deletion even if image deletion fails
      }
    }

    // Delete the popup from the database
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offer-popups/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to delete offer popup",
        errors: errorData.error ? { general: [errorData.error] } : {},
      };
    }

    // Revalidate the offer-popups page
    revalidatePath("/offer-popups");

    return {
      success: true,
      message: "Offer popup deleted successfully",
    };
  } catch (error) {
    console.error("Error in deleteOfferPopup:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
