"use server";

import { revalidatePath } from "next/cache";
import { ImportProduct } from "@/app/(dashboard)/products/_components/form/ProductBulkImportSheet";

export async function importProducts(
  products: ImportProduct[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    if (!products || products.length === 0) {
      return { error: "No products to import." };
    }

    // Map imported products to the shape the backend POST /api/products expects
    const importPromises = products.map(async (p) => {
      const backendFormData = new FormData();

      backendFormData.append("name", p.name);
      backendFormData.append("description", p.description ?? "");
      backendFormData.append("sku", p.sku.toUpperCase());
      backendFormData.append("product_type", "physical");
      backendFormData.append("product_structure", "simple");
      backendFormData.append("cost_price", String(p.costPrice));
      backendFormData.append("selling_price", String(p.salesPrice));
      backendFormData.append("stock", String(p.stock));
      backendFormData.append("published", p.status === "selling" ? "true" : "false");

      // Generate a slug from the product name
      const slug = p.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      backendFormData.append("slug", slug);

      // Tags (comma-separated string → JSON array)
      if (p.tags) {
        const tagsArray = p.tags.split(",").map((t) => t.trim()).filter(Boolean);
        backendFormData.append("tags", JSON.stringify(tagsArray));
      } else {
        backendFormData.append("tags", JSON.stringify([]));
      }

      // Category — send as the categories array format the backend expects
      if (p.category) {
        backendFormData.append(
          "categories",
          JSON.stringify([{ category: p.category, subcategories: [] }])
        );
      }

      // Empty image_url so backend doesn't complain
      backendFormData.append("image_url", JSON.stringify([]));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products`,
        {
          method: "POST",
          body: backendFormData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to import product: ${p.name}`
        );
      }

      return response.json();
    });

    // Run all imports — collect results so partial failures surface clearly
    const results = await Promise.allSettled(importPromises);

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      const firstError = (failed[0] as PromiseRejectedResult).reason;
      return {
        error: `${failed.length} product(s) failed to import. First error: ${firstError?.message ?? "Unknown error"}`,
      };
    }

    revalidatePath("/products");
    return { success: true };
  } catch (error: unknown) {
    console.error("importProducts error:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to import products. Please try again.",
    };
  }
}