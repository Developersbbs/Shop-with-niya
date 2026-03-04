"use server";

import { revalidatePath } from "next/cache";
import { formatValidationErrors } from "@/helpers/formatValidationErrors";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";
import { storage } from "@/firebase/config";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export async function updateHeroSection(
  heroSectionId: string,
  formData: FormData
): Promise<EnhancedServerActionResponse> {
  // Get the image file (optional for updates)
  const imageFile = formData.get("image") as File | null;
  const existingImage = formData.get("existingImage") as string;

  let imageUrl = existingImage || "";

  // If a new image is provided, upload it to Firebase Storage
  if (imageFile && imageFile.size > 0) {
    try {
      // Create a unique filename
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `hero_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `hero-section/${fileName}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, imageFile);
      // Get the download URL
      imageUrl = await getDownloadURL(snapshot.ref);

      // Optionally delete the old image from Firebase Storage
      if (existingImage && existingImage.includes("firebasestorage.app")) {
        try {
          const oldImageRef = ref(storage, existingImage);
          await deleteObject(oldImageRef);
        } catch (deleteError) {
          console.warn("Failed to delete old image:", deleteError);
        }
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      return {
        success: false,
        message: "Failed to upload image",
        errors: {
          image: ["Failed to upload image. Please try again."],
        },
      };
    }
  }

  // Validate required fields
  const title = formData.get("title") as string;
  if (!title || title.trim() === '') {
    return {
      success: false,
      message: "Title is required",
      errors: {
        title: ["Title is required"],
      },
    };
  }

  try {
    // Prepare the API request body
    const requestBody = {
      title: title.trim(),
      subtitle: formData.get("subtitle") || "",
      description: formData.get("description") || "",
      image: imageUrl,
      ctaText: formData.get("ctaText") || "Shop Now",
      ctaLink: formData.get("ctaLink") || "/products",
      gradient: formData.get("gradient") || "from-black/90 via-black/40 to-transparent",
      isActive: formData.get("isActive") === "true",
      order: parseInt(formData.get("order") as string) || 0,
      textColor: formData.get('textColor') || '#ffffff',
      buttonStyle: formData.get('buttonStyle') || 'filled',
      buttonColor: formData.get('buttonColor') || '#ffffff',
      buttonTextColor: formData.get('buttonTextColor') || '#0a0a0a',
    };

    // Make the API request to your backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hero-section/${heroSectionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to update hero section",
        errors: errorData.error ? { general: [errorData.error] } : {},
      };
    }

    const data: ApiResponse<any> = await response.json();

    // Revalidate the hero section page
    revalidatePath("/hero-section");

    return {
      success: true,
      message: "Hero section updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Error in updateHeroSection:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
