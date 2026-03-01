"use server";

import { revalidatePath } from "next/cache";
import { productFormSchema } from "@/app/(dashboard)/products/_components/form/schema";
import { formatValidationErrors } from "@/helpers/formatValidationErrors";
import { ProductServerActionResponse } from "@/types/server-action";
import { storage } from "@/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function editProduct(
  productId: string,
  formData: FormData
): Promise<ProductServerActionResponse> {

  const categoriesJson = formData.get("categories");
  let categories = [];
  try {
    categories = categoriesJson ? JSON.parse(categoriesJson as string) : [];
  } catch (e) {
    console.error("Failed to parse categories:", e);
  }

  // Read new file uploads
  const newImageFiles: File[] = [];
  const existingImageUrls: string[] = [];
  let imageIndex = 0;
  while (formData.has(`images[${imageIndex}]`)) {
    const imageFile = formData.get(`images[${imageIndex}]`);
    if (imageFile instanceof File && imageFile.size > 0) {
      newImageFiles.push(imageFile);
    }
    imageIndex++;
  }

  // Read existing URLs from image_url field (sent by ProductFormSheet)
  const imageUrlJson = formData.get("image_url");
  if (imageUrlJson && typeof imageUrlJson === 'string') {
    try {
      const parsed = JSON.parse(imageUrlJson);
      if (Array.isArray(parsed)) {
        existingImageUrls.push(...parsed);
      }
    } catch (e) { }
  }

  const tagsJson = formData.get("tags");
  let tags = [];
  try {
    tags = tagsJson ? JSON.parse(tagsJson as string) : [];
  } catch (e) {
    console.error("Failed to parse tags:", e);
  }

  const seoKeywordsJson = formData.get("seoKeywords");
  let seoKeywords = [];
  try {
    seoKeywords = seoKeywordsJson ? JSON.parse(seoKeywordsJson as string) : [];
  } catch (e) { }

  const variantsJson = formData.get("product_variants");
  let variants = null;
  try {
    variants = variantsJson ? JSON.parse(variantsJson as string) : null;
  } catch (e) {
    console.error("Failed to parse variants:", e);
  }

 
 // Extract NEW variant image files from FormData
  const variantImageFiles: { [key: string]: File[] } = {};
  let comboIndex = 0;
  let fileIndex = 0;

  while (true) {
    const file = formData.get(`variantImages[${comboIndex}][${fileIndex}]`);
    if (!file || !(file instanceof File)) {
      if (fileIndex === 0) break;
      comboIndex++;
      fileIndex = 0;
      continue;
    }
    if (!variantImageFiles[comboIndex.toString()]) {
      variantImageFiles[comboIndex.toString()] = [];
    }
    variantImageFiles[comboIndex.toString()].push(file);
    fileIndex++;
  }

  // Extract EXISTING variant image URLs from FormData
  const existingVariantImages: { [key: string]: string[] } = {};
  const allFormEntries = Array.from(formData.entries());
  allFormEntries.forEach(([key, val]) => {
    const match = key.match(/existingVariantImages\[(\d+)\]\[(\d+)\]/);
    if (match && typeof val === 'string') {
      const idx = match[1];
      if (!existingVariantImages[idx]) existingVariantImages[idx] = [];
      existingVariantImages[idx].push(val);
    }
  });

  console.log('🔥 existingVariantImages:', existingVariantImages);
  console.log('🔥 variantImageFiles keys:', Object.keys(variantImageFiles));

  const parsedData = productFormSchema.safeParse({
    productType: formData.get("productType"),
    productStructure: formData.get("product_structure"),
    name: formData.get("name"),
    description: formData.get("description"),
    images: newImageFiles,
    sku: formData.get("sku"),
    categories: categories,
    costPrice: formData.get("costPrice"),
    salesPrice: formData.get("salesPrice"),
    stock: formData.get("stock") || 0,
    minStockThreshold: formData.get("minStockThreshold") || 0,
    weight: formData.get("weight") || undefined,
    color: formData.get("color") || undefined,
    size: formData.get("size") || undefined,
    material: formData.get("material") || undefined,
    brand: formData.get("brand") || undefined,
    warranty: formData.get("warranty") || undefined,
    fileUpload: formData.get("fileUpload") || undefined,
    fileSize: formData.get("fileSize") || undefined,
    downloadFormat: formData.get("downloadFormat") || undefined,
    licenseType: formData.get("licenseType") || undefined,
    downloadLimit: formData.get("downloadLimit") || undefined,
    tags: tags,
    seoTitle: formData.get("seoTitle") || undefined,
    seoDescription: formData.get("seoDescription") || undefined,
    seoKeywords: seoKeywords,
    slug: formData.get("slug"),
    product_variants: variants,
  });

  if (!parsedData.success) {
    return {
      validationErrors: formatValidationErrors(
        parsedData.error.flatten().fieldErrors
      ),
    };
  }

  try {
    // Firebase upload helper
    const uploadImageToFirebase = async (file: File, folder: string) => {
      const sanitizedName = file.name.replace(/\s+/g, "_");
      const fileExtension = sanitizedName.split('.').pop();
      const fileName = `${folder}_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExtension}`;
      const storageRef = ref(storage, `${folder}/${fileName}`);
      const snapshot = await uploadBytes(storageRef, file);
      return getDownloadURL(snapshot.ref);
    };

    // Upload new images to Firebase and get URLs
    const newFirebaseUrls = await Promise.all(
      newImageFiles.map((file) => uploadImageToFirebase(file, "products"))
    );

    // Merge existing URLs + new Firebase URLs
    const allImageUrls = [...existingImageUrls, ...newFirebaseUrls];

    console.log('🔥 existingImageUrls:', existingImageUrls);
    console.log('🔥 newFirebaseUrls:', newFirebaseUrls);
    console.log('🔥 allImageUrls:', allImageUrls);

    // Upload variant images to Firebase
    const variantImageUrls: Record<string, string[]> = {};
    await Promise.all(
      Object.entries(variantImageFiles).map(async ([comboIdx, files]) => {
        const urls = await Promise.all(
          files.map((file) => uploadImageToFirebase(file, "product-variants"))
        );
        variantImageUrls[comboIdx] = urls;
      })
    );

  
    const backendFormData = new FormData()
// Merge variant images: existing URLs + new Firebase URLs
    if (variants && variants.combinations && variants.combinations.length > 0) {
      variants.combinations = variants.combinations.map((combination: any, index: number) => {
        const idx = index.toString();
        // New files uploaded to Firebase
        const newUrls = variantImageUrls[idx] || [];
        // Existing URLs sent from frontend as existingVariantImages[x][y]
        const preservedUrls = existingVariantImages[idx] || [];
        // Final merge: preserved + new
        const mergedImages = [...preservedUrls, ...newUrls];

        console.log(`🔥 Variant ${idx} images: ${preservedUrls.length} existing + ${newUrls.length} new = ${mergedImages.length} total`);

        return {
          ...combination,
          images: mergedImages,
        };
      });
    }
    // Send all variant image URLs (existing + new Firebase) as existingVariantImages
// so backend knows to preserve them — no raw files sent, all are Firebase URLs
if (variants && variants.combinations) {
  variants.combinations.forEach((combination: any, index: number) => {
    const images: string[] = (combination.images || []).filter((img: any) => typeof img === 'string');
    images.forEach((url, urlIdx) => {
      backendFormData.append(`existingVariantImages[${index}][${urlIdx}]`, url);
    });
  });
}
;
    backendFormData.append("product_type", parsedData.data.productType);
    backendFormData.append("name", parsedData.data.name);
    backendFormData.append("description", parsedData.data.description);
    backendFormData.append("sku", parsedData.data.sku);

    if (parsedData.data.categories && parsedData.data.categories.length > 0) {
      backendFormData.append("categories", JSON.stringify(parsedData.data.categories));
    }

    backendFormData.append("cost_price", parsedData.data.costPrice?.toString() || "0");
    backendFormData.append("selling_price", parsedData.data.salesPrice?.toString() || "0");

    if (parsedData.data.stock !== undefined) {
      backendFormData.append("stock", parsedData.data.stock.toString());
    }
    if (parsedData.data.minStockThreshold !== undefined) {
      backendFormData.append("min_stock_threshold", parsedData.data.minStockThreshold.toString());
    }
    if (parsedData.data.color) backendFormData.append("color", parsedData.data.color);
    if (parsedData.data.size) backendFormData.append("size", parsedData.data.size);
    if (parsedData.data.material) backendFormData.append("material", parsedData.data.material);
    if (parsedData.data.brand) backendFormData.append("brand", parsedData.data.brand);
    if (parsedData.data.warranty) backendFormData.append("warranty", parsedData.data.warranty);
    if (parsedData.data.fileSize) backendFormData.append("file_size", parsedData.data.fileSize.toString());
    if (parsedData.data.downloadFormat) backendFormData.append("download_format", parsedData.data.downloadFormat);
    if (parsedData.data.licenseType) backendFormData.append("license_type", parsedData.data.licenseType);
    if (parsedData.data.downloadLimit) backendFormData.append("download_limit", parsedData.data.downloadLimit.toString());
    if (parsedData.data.tags !== undefined) backendFormData.append("tags", JSON.stringify(parsedData.data.tags || []));

    backendFormData.append("published", "true");

    if (parsedData.data.seoTitle) backendFormData.append("seo_title", parsedData.data.seoTitle);
    if (parsedData.data.seoDescription) backendFormData.append("seo_description", parsedData.data.seoDescription);
    if (parsedData.data.seoKeywords && parsedData.data.seoKeywords.length > 0) {
      backendFormData.append("seo_keywords", JSON.stringify(parsedData.data.seoKeywords));
    }
    if (parsedData.data.seoCanonical) backendFormData.append("seo_canonical", parsedData.data.seoCanonical);
    if (parsedData.data.seoRobots) backendFormData.append("seo_robots", parsedData.data.seoRobots);
    if (parsedData.data.seoOgTitle) backendFormData.append("seo_og_title", parsedData.data.seoOgTitle);
    if (parsedData.data.seoOgDescription) backendFormData.append("seo_og_description", parsedData.data.seoOgDescription);
    if (parsedData.data.seoOgImage) backendFormData.append("seo_og_image", parsedData.data.seoOgImage);

    if (parsedData.data.product_variants) {
      backendFormData.append("product_variants", JSON.stringify(variants));
    }

    // Send all image URLs (existing + new Firebase URLs)
    backendFormData.append("image_url", JSON.stringify(allImageUrls));

    if (parsedData.data.fileUpload instanceof File) {
      backendFormData.append("digital_file", parsedData.data.fileUpload);
    }

    console.log('🔥 CALLING PUT:', `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`);
    console.log('🔥 productId:', productId);
    console.log('🔥 image_url in formData:', backendFormData.get('image_url'));

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`, {
      method: "PUT",
      body: backendFormData,
    });

    const result = await response.json();

    console.log('🔥 BACKEND RESPONSE:', JSON.stringify(result, null, 2));

    if (!response.ok) {
      if (result.error?.includes("slug")) {
        return {
          validationErrors: {
            slug: "This product slug is already in use. Please choose a different one.",
          },
        };
      } else if (result.error?.includes("sku") || result.error?.includes("SKU")) {
        return {
          validationErrors: {
            sku: "This product SKU is already assigned to an existing item. Please enter a different SKU.",
          },
        };
      }
      console.error("Product update failed:", result);
      return { dbError: result.error || "Something went wrong. Please try again later." };
    }

    revalidatePath("/products");
    return { success: true, product: result.data };
  } catch (error: any) {
    console.error("Unexpected error in editProduct:", error);
    return { dbError: error.message || "An unexpected error occurred." };
  }
}