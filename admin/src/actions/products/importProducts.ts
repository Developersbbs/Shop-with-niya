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

    const importPromises = products.map(async (p) => {
      const backendFormData = new FormData();

      // ── Identity ──────────────────────────────────────────────────
      backendFormData.append("name", p.name);
      backendFormData.append("sku", p.sku.toUpperCase());
      backendFormData.append("description", p.description ?? "");

      // Generate slug from name if not provided
      const slug = p.slug || p.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      backendFormData.append("slug", slug);

      // ── Type & Structure ──────────────────────────────────────────
      backendFormData.append("product_type", p.productType ?? "physical");
      backendFormData.append("product_structure", p.productStructure ?? "simple");
      backendFormData.append("product_nature", p.productNature ?? "normal");

      // ── Status & Published ────────────────────────────────────────
      backendFormData.append("published", p.published ? "true" : "false");

      // ── Category ──────────────────────────────────────────────────
      if (p.category) {
        backendFormData.append(
          "categories",
          JSON.stringify([{ category: p.category, subcategories: [] }])
        );
      }

      // ── Pricing ───────────────────────────────────────────────────
      if (p.productStructure === "simple") {
        backendFormData.append("cost_price", String(p.costPrice));
        backendFormData.append("selling_price", String(p.salesPrice));
      }
      backendFormData.append("tax_percentage", String(p.taxPercentage ?? 0));

      // ── Stock ─────────────────────────────────────────────────────
      backendFormData.append("stock", String(p.stock ?? 0));
      backendFormData.append("min_stock_threshold", String(p.minStock ?? 0));

      // ── Physical attributes ───────────────────────────────────────
      if (p.weight) backendFormData.append("weight", String(p.weight));
      if (p.color) backendFormData.append("color", p.color);

      // ── Digital fields ────────────────────────────────────────────
      if (p.productType === "digital") {
        if (p.downloadFormat) backendFormData.append("download_format", p.downloadFormat);
        if (p.fileSize) backendFormData.append("file_size", String(p.fileSize));
        if (p.licenseType) backendFormData.append("license_type", p.licenseType);
        if (p.downloadLimit) backendFormData.append("download_limit", String(p.downloadLimit));
      }

      // ── SEO ───────────────────────────────────────────────────────
      if (p.seoTitle) backendFormData.append("seo_title", p.seoTitle);
      if (p.seoDescription) backendFormData.append("seo_description", p.seoDescription);
      if (p.seoKeywords) backendFormData.append("seo_keywords", JSON.stringify(p.seoKeywords.split(";").map(k => k.trim()).filter(Boolean)));
      if (p.seoCanonical) backendFormData.append("seo_canonical", p.seoCanonical);
      if (p.seoRobots) backendFormData.append("seo_robots", p.seoRobots);
      if (p.ogTitle) backendFormData.append("seo_og_title", p.ogTitle);
      if (p.ogDescription) backendFormData.append("seo_og_description", p.ogDescription);
      if (p.ogImage) backendFormData.append("seo_og_image", p.ogImage);

      // ── Tags ──────────────────────────────────────────────────────
      if (p.tags) {
        const tagsArray = p.tags.split(";").map((t) => t.trim()).filter(Boolean);
        backendFormData.append("tags", JSON.stringify(tagsArray));
      } else {
        backendFormData.append("tags", JSON.stringify([]));
      }

      // ── Variant ───────────────────────────────────────────────────
      if (p.productStructure === "variant" && p.variantSku) {
        // Parse attributes string "color:Blue; size:M" → { color: "Blue", size: "M" }
        const attributesObj: Record<string, string> = {};
        if (p.variantAttributes) {
          p.variantAttributes.split(";").forEach((pair) => {
            const [k, v] = pair.split(":").map((s) => s.trim());
            if (k && v) attributesObj[k] = v;
          });
        }

        const variantCombination = {
          name: p.variantName || p.variantSku,
          sku: p.variantSku,
          slug: p.variantSlug || p.variantSku.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          cost_price: p.variantCostPrice ?? p.costPrice,
          selling_price: p.variantSalePrice ?? p.salesPrice,
          stock: p.variantStock ?? p.stock ?? 0,
          minStock: p.variantMinStock ?? p.minStock ?? 0,
          status: p.variantStatus || "draft",
          published: p.published,
          attributes: attributesObj,
          images: [],
        };

        backendFormData.append(
          "product_variants",
          JSON.stringify({
            combinations: [variantCombination],
            autoGenerateSKU: false,
          })
        );
      }

      // No images during import
      backendFormData.append("image_url", JSON.stringify([]));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products`,
        { method: "POST", body: backendFormData }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to import product: ${p.name}`);
      }

      return response.json();
    });

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
      error: error instanceof Error ? error.message : "Failed to import products. Please try again.",
    };
  }
}