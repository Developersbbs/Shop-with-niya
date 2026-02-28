"use server";

import { revalidatePath } from "next/cache";
import { categoryFormSchema } from "@/app/(dashboard)/categories/_components/form/schema";
import { formatValidationErrors } from "@/helpers/formatValidationErrors";
import { CategoryServerActionResponse } from "@/types/server-action";
import { apiPut } from "@/lib/api-server";
import { storage } from "@/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function editCategory(
  categoryId: string,
  formData: FormData
): Promise<CategoryServerActionResponse> {

  // Parse subcategories from FormData
  const subcategoriesData: any[] = [];

  // Try JSON first
  const subcategoriesJson = formData.get('subcategories');
  if (subcategoriesJson && typeof subcategoriesJson === 'string') {
    try {
      const parsed = JSON.parse(subcategoriesJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((subcat: any) => {
          if (subcat && subcat.name) {
            subcategoriesData.push({
              name: String(subcat.name),
              description: subcat.description ? String(subcat.description) : "",
              slug: subcat.slug ? String(subcat.slug) : "",
              published: subcat.published !== undefined ? Boolean(subcat.published) : true,
            });
          }
        });
      }
    } catch (e) {
      console.warn('Failed to parse subcategories JSON, falling back to form data', e);
    }
  }

  // Fallback: read individual form fields
  if (subcategoriesData.length === 0) {
    let subcategoryIndex = 0;
    while (formData.has(`subcategories.${subcategoryIndex}.name`)) {
      const name = formData.get(`subcategories.${subcategoryIndex}.name`);
      const description = formData.get(`subcategories.${subcategoryIndex}.description`);
      const slug = formData.get(`subcategories.${subcategoryIndex}.slug`);
      const published = formData.get(`subcategories.${subcategoryIndex}.published`);
      if (name) {
        subcategoriesData.push({
          name: String(name),
          description: description ? String(description) : "",
          slug: slug ? String(slug) : "",
          published: published !== undefined ? String(published) === 'true' : true,
        });
      }
      subcategoryIndex++;
    }
  }

  console.log('Edit parsed subcategories data:', subcategoriesData);

  // Validate
  const parsedData = categoryFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    image: formData.get("image"),
    slug: formData.get("slug"),
    subcategories: subcategoriesData,
  });

  if (!parsedData.success) {
    return {
      validationErrors: formatValidationErrors(
        parsedData.error.flatten().fieldErrors
      ),
    };
  }

  try {
    const requestBody: any = {
      name: parsedData.data.name,
      description: parsedData.data.description || "",
      slug: parsedData.data.slug,
    };

    // ✅ FIX: ALWAYS send subcategory fields to backend
    // Even if subcategoriesData is empty, we send subcategories.delete = true
    // so backend knows to delete all existing subcategories
    if (subcategoriesData.length > 0) {
      subcategoriesData.forEach((subcat, index) => {
        requestBody[`subcategories.${index}.name`] = subcat.name;
        requestBody[`subcategories.${index}.description`] = subcat.description || '';
        requestBody[`subcategories.${index}.slug`] = subcat.slug || '';
        requestBody[`subcategories.${index}.published`] = subcat.published;
      });
    } else {
      // ✅ FIX: Send a sentinel key so backend knows subcategories were explicitly cleared
      requestBody['subcategories.cleared'] = 'true';
    }

    // Handle image
    if (parsedData.data.image) {
      if (parsedData.data.image instanceof File && parsedData.data.image.size > 0) {
        const fileExtension = parsedData.data.image.name.split('.').pop();
        const fileName = `category_${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, `categories/${fileName}`);
        try {
          const snapshot = await uploadBytes(storageRef, parsedData.data.image);
          const imageUrl = await getDownloadURL(snapshot.ref);
          requestBody.image = imageUrl;
        } catch (error) {
          console.error("Error uploading image:", error);
          return { dbError: "Failed to upload image. Please try again." };
        }
      } else if (typeof parsedData.data.image === 'string') {
        requestBody.image = parsedData.data.image;
      }
    }

    console.log('Sending update request with data:', requestBody);

    const response = await apiPut<{ success: boolean; data: any }>(
      `/api/categories/${categoryId}`,
      requestBody
    );

    if (!response.success) {
      return { dbError: "Failed to update category" };
    }

    revalidatePath("/categories");
    return { success: true, category: response.data };

  } catch (error: any) {
    console.error("Category update failed:", error);
    if (error.message?.includes("duplicate") || error.message?.includes("already exists")) {
      if (error.message.toLowerCase().includes("slug")) {
        return { validationErrors: { slug: "This category slug is already in use. Please choose a different one." } };
      } else if (error.message.toLowerCase().includes("name")) {
        return { validationErrors: { name: "A category with this name already exists. Please enter a unique name." } };
      }
    }
    return { dbError: error.message || "Something went wrong." };
  }
}