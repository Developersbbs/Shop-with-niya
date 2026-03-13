"use server";

import { revalidatePath } from "next/cache";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";
import { storage } from "@/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function updateOfferPopup(
  id: string,
  formData: FormData
): Promise<EnhancedServerActionResponse> {
  // Get the image file
  const imageFile = formData.get("image") as File | null;

  // Upload new image if provided
  let imageUrl = "";
  if (imageFile && imageFile.size > 0) {
    try {
      // Create a unique filename
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `popup_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `offer-popups/${fileName}`);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, imageFile);
      // Get the download URL
      imageUrl = await getDownloadURL(snapshot.ref);
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
  const headingRaw = formData.get("heading");
  const descriptionRaw = formData.get("description");
  const heading = typeof headingRaw === "string" ? headingRaw : "";
  const description = typeof descriptionRaw === "string" ? descriptionRaw : "";

  if (!heading || heading.trim() === '') {
    return {
      success: false,
      message: "Heading is required",
      errors: {
        heading: ["Heading is required"],
      },
    };
  }

  if (!description || description.trim() === '') {
    return {
      success: false,
      message: "Description is required",
      errors: {
        description: ["Description is required"],
      },
    };
  }

  try {
    // Prepare the API request body
    const requestBody: Record<string, string | number | boolean | null> = {
      heading: heading.trim(),
      description: description.trim(),
      buttonText: (formData.get("buttonText") as string) || "Shop Now",
      buttonLink: (formData.get("buttonLink") as string) || "/products",
      isActive: formData.get("isActive") === "true",
      priority: parseInt(formData.get("priority") as string) || 0,
    };

    // Only include dates if they're provided
    const startDateRaw = formData.get("startDate");
    const endDateRaw = formData.get("endDate");
    const startDate = typeof startDateRaw === "string" ? startDateRaw : "";
    const endDate = typeof endDateRaw === "string" ? endDateRaw : "";
    if (startDate && startDate.trim() !== '') {
      requestBody.startDate = startDate;
    }
    if (endDate && endDate.trim() !== '') {
      requestBody.endDate = endDate;
    }

    // Include linked_offer if provided
    const linkedOfferRaw = formData.get("linked_offer");
    const linkedOffer = typeof linkedOfferRaw === "string" ? linkedOfferRaw : "";
    if (linkedOffer && linkedOffer.trim() !== '') {
      requestBody.linked_offer = linkedOffer;
    }

    // Include image URL only if a new image was uploaded
    if (imageUrl) {
      requestBody.image = imageUrl;
    }

    // Make the API request to your backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offer-popups/${id}`, {
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
        message: errorData.message || "Failed to update offer popup",
        errors: errorData.error ? { general: [errorData.error] } : {},
      };
    }

    const data: ApiResponse<Record<string, unknown>> = await response.json();

    // Revalidate the offer-popups page
    revalidatePath("/offer-popups");

    return {
      success: true,
      message: "Offer popup updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Error in updateOfferPopup:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
