"use server";

import { revalidatePath } from "next/cache";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";
import { storage } from "@/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function addOfferPopup(
  formData: FormData
): Promise<EnhancedServerActionResponse> {
  // Get the image file
  const imageFile = formData.get("image") as File | null;

  // If no image is provided, return an error
  if (!imageFile) {
    return {
      success: false,
      message: "Image is required",
      errors: {
        image: ["Image is required"],
      },
    };
  }

  // Upload the image to Firebase Storage
  let imageUrl = "";
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
    const requestBody = {
      heading: heading.trim(),
      description: description.trim(),
      buttonText: typeof formData.get("buttonText") === "string" ? (formData.get("buttonText") as string) : "Shop Now",
      buttonLink: typeof formData.get("buttonLink") === "string" ? (formData.get("buttonLink") as string) : "/products",
      image: imageUrl, // Use the uploaded image URL
      isActive: formData.get("isActive") === "true",
      priority: parseInt(formData.get("priority") as string) || 0,
      startDate: typeof formData.get("startDate") === "string" ? (formData.get("startDate") as string) : null,
      endDate: typeof formData.get("endDate") === "string" ? (formData.get("endDate") as string) : null,
      linked_offer: typeof formData.get("linked_offer") === "string" ? (formData.get("linked_offer") as string) : null,
    };

    // Make the API request to your backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offer-popups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      return {
        success: false,
        message: errorData.message || "Failed to create offer popup",
        errors: errorData.error ? { general: [errorData.error] } : {},
      };
    }

    const data: ApiResponse<Record<string, unknown>> = await response.json();

    // Revalidate the offer-popups page
    revalidatePath("/offer-popups");

    return {
      success: true,
      message: "Offer popup created successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Error in addOfferPopup:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
      errors: {
        general: ["An unexpected error occurred. Please try again."],
      },
    };
  }
}
