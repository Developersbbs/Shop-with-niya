"use server";

import { revalidatePath } from "next/cache";
import { couponFormSchema, CouponFormData } from "@/app/(dashboard)/coupons/_components/form/schema";
import { formatValidationErrors } from "@/helpers/formatValidationErrors";
import { CouponServerActionResponse } from "@/types/server-action";
import { ApiResponse, Coupon } from "@/types/api";
import { storage } from "@/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export async function addCoupon(
  data: CouponFormData
): Promise<CouponServerActionResponse> {
  // Handle image upload if present
  let imageUrl = "";
  
  // Validate and process image field
  if (data.image) {
    if (data.image instanceof File) {
      if (data.image.size > 0) {
        try {
          // Create a unique filename
          const fileExtension = data.image.name.split('.').pop();
          const fileName = `coupon_${Date.now()}.${fileExtension}`;
          const storageRef = ref(storage, `coupons/${fileName}`);
          
          // Upload the file
          const snapshot = await uploadBytes(storageRef, data.image);
          // Get the download URL
          imageUrl = await getDownloadURL(snapshot.ref);
        } catch (error) {
          console.error("Error uploading coupon image:", error);
          return {
            success: false,
            message: "Failed to upload image",
            errors: {
              image: ["Failed to upload image. Please try again."],
            },
          };
        }
      }
    } else if (typeof data.image === "string") {
      // Check if it's a valid URL
      try {
        new URL(data.image);
        imageUrl = data.image;
      } catch {
        // Not a valid URL, treat as no image
        console.log("Invalid image URL, treating as no image");
        imageUrl = "";
      }
    } else if (typeof data.image === "object" && 'path' in data.image) {
      // Handle the case where image is an object with path property
      console.log("Image object with path detected, treating as no image");
      imageUrl = "";
    } else {
      // Any other type, treat as no image
      console.log("Unknown image type detected, treating as no image:", typeof data.image);
      imageUrl = "";
    }
  }

  console.log("About to validate data:", data);
  const parsedData = couponFormSchema.safeParse(data);

  if (!parsedData.success) {
    console.error("Validation errors:", parsedData.error.flatten());
    console.error("All error issues:", parsedData.error.issues);
    return {
      validationErrors: formatValidationErrors(
        parsedData.error.flatten().fieldErrors
      ),
    };
  }

  console.log("Validation passed! Parsed data:", parsedData.data);

  const {
    campaignName,
    code,
    description,
    discountType,
    discountValue,
    cashbackAmount,
    minPurchase,
    maxDiscount,
    usageLimit,
    limitPerUser,
    startDate,
    endDate,
    isActive,
    published,
    autoApply,
    firstOrderOnly,
    newUserOnly,
    priority,
    applicableCategories,
    applicableProducts,
    applicableVariants,
    applicableUsers,
    excludedCategories,
    excludedProducts,
    excludedVariants,
    visibilityOptions,
    bogoConfig,
  } = parsedData.data;

  type CategorySelectionInput = Array<
    string | { categoryId?: string; subcategoryIds?: string[] }
  > | undefined;

  const extractCategoryAndSubcategoryIds = (items: CategorySelectionInput) => {
    const categoryIds = new Set<string>();
    const subcategoryIds = new Set<string>();

    (items || []).forEach((item) => {
      if (!item) return;

      if (typeof item === "string") {
        categoryIds.add(item);
        return;
      }

      if (item.categoryId) {
        categoryIds.add(item.categoryId);
      }

      if (Array.isArray(item.subcategoryIds)) {
        item.subcategoryIds.forEach((id) => {
          if (id) {
            subcategoryIds.add(id);
          }
        });
      }
    });

    return {
      categories: Array.from(categoryIds),
      subcategories: Array.from(subcategoryIds),
    };
  };

  const applicableSelections = extractCategoryAndSubcategoryIds(applicableCategories);
  const excludedSelections = extractCategoryAndSubcategoryIds(excludedCategories);
  const bogoBuySelections = extractCategoryAndSubcategoryIds(bogoConfig?.buyCategories);
  const bogoGetSelections = extractCategoryAndSubcategoryIds(bogoConfig?.getCategories);

  const payload = {
    campaign_name: campaignName,
    code,
    description: description || undefined,
    image_url: imageUrl || undefined,
    discount_type: discountType,
    discount_value:
      discountType === "percentage" || discountType === "fixed"
        ? discountValue ?? 0
        : null, // Send null for cashback, bogo, and free_shipping types
    cashback_amount: discountType === "cashback" ? cashbackAmount ?? 0 : undefined,
    min_purchase: minPurchase ?? 0,
    max_discount: discountType === "percentage" ? maxDiscount ?? null : null,
    usage_limit: usageLimit ?? null,
    limit_per_user: limitPerUser ?? null,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    is_active: isActive,
    published,
    auto_apply: autoApply,
    first_order_only: firstOrderOnly,
    new_user_only: newUserOnly,
    priority,
    applicable_categories: applicableSelections.categories,
    applicable_subcategories: applicableSelections.subcategories,
    applicable_products: applicableProducts,
    applicable_variants: applicableVariants,
    applicable_users: applicableUsers,
    excluded_categories: excludedSelections.categories,
    excluded_subcategories: excludedSelections.subcategories,
    excluded_products: excludedProducts,
    excluded_variants: excludedVariants,
    visibility_options: {
      show_on_checkout: visibilityOptions.showOnCheckout,
      show_on_homepage: visibilityOptions.showOnHomepage,
      show_on_product_page: visibilityOptions.showOnProductPage,
      show_in_cart: visibilityOptions.showInCart,
    },
    bogo_config:
      discountType === "bogo"
        ? {
            buy_quantity: bogoConfig?.buyQuantity ?? 1,
            get_quantity: bogoConfig?.getQuantity ?? 1,
            buy_products: bogoConfig?.buyProducts ?? [],
            get_products: bogoConfig?.getProducts ?? [],
            buy_categories: bogoBuySelections.categories,
            buy_subcategories: bogoBuySelections.subcategories,
            get_categories: bogoGetSelections.categories,
            get_subcategories: bogoGetSelections.subcategories,
          }
        : undefined,
  };

  try {
    console.log("Sending payload to backend:", payload);
    // Make the API request to your backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData: ApiResponse<null> = await response.json();
      console.error("Backend error response:", errorData);
      return {
        success: false,
        dbError: errorData.error || "Failed to create coupon",
        errors: errorData.errors || {},
      };
    }

    const data: ApiResponse<Coupon> = await response.json();

    // Revalidate the coupons page
    revalidatePath("/coupons");

    return {
      success: true,
      coupon: data.data,
    };
  } catch (error) {
    console.error("Error in addCoupon:", error);
    return {
      success: false,
      dbError: "An unexpected error occurred. Please try again.",
    };
  }
}
