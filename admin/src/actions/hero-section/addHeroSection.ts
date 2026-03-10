"use server";

import { revalidatePath } from "next/cache";
import { EnhancedServerActionResponse } from "@/types/server-action";
import { ApiResponse } from "@/types/api";
import { storage } from "@/firebase/config";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// ── Shared helper: upload a file to Firebase and return its URL ──
async function uploadToFirebase(file: File, folder = "hero-section"): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, `${folder}/${fileName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

// ── Shared helper: safely delete an old Firebase file ──
async function deleteFromFirebase(url: string) {
  if (!url || !url.includes("firebasestorage")) return;
  try {
    await deleteObject(ref(storage, url));
  } catch (e) {
    console.warn("Could not delete old Firebase file:", e);
  }
}

// ─────────────────────────────────────────────
//  ADD
// ─────────────────────────────────────────────
export async function addHeroSection(
  formData: FormData
): Promise<EnhancedServerActionResponse> {

  const title = formData.get("title") as string;
  if (!title?.trim()) {
    return { success: false, message: "Title is required", errors: { title: ["Title is required"] } };
  }

  // Desktop image — required
  const imageFile = formData.get("image") as File | null;
  if (!imageFile || imageFile.size === 0) {
    return { success: false, message: "Image is required", errors: { image: ["Image is required"] } };
  }

  let imageUrl = "";
  try {
    imageUrl = await uploadToFirebase(imageFile);
  } catch {
    return { success: false, message: "Failed to upload desktop image", errors: { image: ["Upload failed. Please try again."] } };
  }

  // Mobile image — optional
  let imageMobileUrl: string | undefined;
  const imageMobileFile = formData.get("imageMobile") as File | null;
  if (imageMobileFile && imageMobileFile.size > 0) {
    try {
      imageMobileUrl = await uploadToFirebase(imageMobileFile, "hero-section/mobile");
    } catch {
      return { success: false, message: "Failed to upload mobile image", errors: { imageMobile: ["Mobile upload failed. Please try again."] } };
    }
  }

  try {
    const requestBody: Record<string, unknown> = {
      title: title.trim(),
      subtitle:       formData.get("subtitle")     || "",
      description:    formData.get("description")  || "",
      image:          imageUrl,
      imageMobile:    imageMobileUrl,               // undefined = omitted
      primaryCTA:     JSON.parse((formData.get("primaryCTA")   as string) || "{}"),
      secondaryCTA:   formData.get("secondaryCTA") ? JSON.parse(formData.get("secondaryCTA") as string) : undefined,
      gradient:       formData.get("gradient")     || "from-black/90 via-black/40 to-transparent",
      isActive:       formData.get("isActive")     === "true",
      order:          parseInt(formData.get("order") as string) || 0,
      templateType:   formData.get("templateType") || "center",
      showOn:         formData.get("showOn")       || "all",
      textColor:      formData.get("textColor")    || "#ffffff",
      buttonStyle:    formData.get("buttonStyle")  || "filled",
      buttonColor:    formData.get("buttonColor")  || "#ffffff",
      buttonTextColor:formData.get("buttonTextColor") || "#0a0a0a",
    };

    if (formData.get("startDate")) requestBody.startDate = formData.get("startDate");
    if (formData.get("endDate"))   requestBody.endDate   = formData.get("endDate");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hero-section`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data: ApiResponse<any> = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || "Failed to create hero section", errors: {} };
    }

    revalidatePath("/hero-section");
    return { success: true, message: "Hero section created successfully", data: data.data };

  } catch (error) {
    console.error("Error in addHeroSection:", error);
    return { success: false, message: "An unexpected error occurred", errors: { general: ["Please try again."] } };
  }
}

// ─────────────────────────────────────────────
//  UPDATE
// ─────────────────────────────────────────────
export async function updateHeroSection(
  heroSectionId: string,
  formData: FormData
): Promise<EnhancedServerActionResponse> {

  const title = formData.get("title") as string;
  if (!title?.trim()) {
    return { success: false, message: "Title is required", errors: { title: ["Title is required"] } };
  }

  // ── Desktop image ──
  const imageFile      = formData.get("image")         as File | null;
  const existingImage  = formData.get("existingImage") as string;
  let imageUrl = existingImage || "";

  if (imageFile && imageFile.size > 0) {
    try {
      imageUrl = await uploadToFirebase(imageFile);
      await deleteFromFirebase(existingImage); // clean up old
    } catch {
      return { success: false, message: "Failed to upload desktop image", errors: { image: ["Upload failed."] } };
    }
  }

  // ── Mobile image ──
  const imageMobileFile      = formData.get("imageMobile")         as File | null;
  const existingImageMobile  = formData.get("existingImageMobile") as string;
  const removeMobileImage    = formData.get("removeMobileImage")   === "true";

  let imageMobileUrl: string | undefined = existingImageMobile || undefined;

  if (removeMobileImage) {
    // User explicitly cleared mobile image
    await deleteFromFirebase(existingImageMobile);
    imageMobileUrl = undefined;
  } else if (imageMobileFile && imageMobileFile.size > 0) {
    // User uploaded a new mobile image
    try {
      imageMobileUrl = await uploadToFirebase(imageMobileFile, "hero-section/mobile");
      await deleteFromFirebase(existingImageMobile); // clean up old
    } catch {
      return { success: false, message: "Failed to upload mobile image", errors: { imageMobile: ["Mobile upload failed."] } };
    }
  }

  try {
    const requestBody: Record<string, unknown> = {
      title:          title.trim(),
      subtitle:       formData.get("subtitle")     || "",
      description:    formData.get("description")  || "",
      image:          imageUrl,
      imageMobile:    imageMobileUrl,               // undefined clears it in backend
      primaryCTA:     JSON.parse((formData.get("primaryCTA")   as string) || "{}"),
      secondaryCTA:   formData.get("secondaryCTA") ? JSON.parse(formData.get("secondaryCTA") as string) : undefined,
      gradient:       formData.get("gradient")     || "from-black/90 via-black/40 to-transparent",
      isActive:       formData.get("isActive")     === "true",
      order:          parseInt(formData.get("order") as string) || 0,
      templateType:   formData.get("templateType") || "center",
      showOn:         formData.get("showOn")       || "all",
      textColor:      formData.get("textColor")    || "#ffffff",
      buttonStyle:    formData.get("buttonStyle")  || "filled",
      buttonColor:    formData.get("buttonColor")  || "#ffffff",
      buttonTextColor:formData.get("buttonTextColor") || "#0a0a0a",
    };

    if (formData.get("startDate")) requestBody.startDate = formData.get("startDate");
    if (formData.get("endDate"))   requestBody.endDate   = formData.get("endDate");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/hero-section/${heroSectionId}`,
      { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }
    );

    const data: ApiResponse<any> = await response.json();
    if (!response.ok) {
      return { success: false, message: data.message || "Failed to update hero section", errors: {} };
    }

    revalidatePath("/hero-section");
    return { success: true, message: "Hero section updated successfully", data: data.data };

  } catch (error) {
    console.error("Error in updateHeroSection:", error);
    return { success: false, message: "An unexpected error occurred", errors: { general: ["Please try again."] } };
  }
}