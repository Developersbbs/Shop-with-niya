import axiosInstance from "@/helpers/axiosInstance";

export interface Variant {
  _id: string;
  name: string;
  sku: string;
  selling_price: number;
  stock: number;
  status: string;
  published: boolean;
  product_id: string;
  product_name: string;
  displayName: string;
}

export interface VariantSearchResponse {
  success: boolean;
  data: Variant[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export const fetchVariantsDropdown = async (search?: string, productIds?: string[]): Promise<Variant[]> => {
  try {
    // Fetch products and extract variants from them
    const response = await axiosInstance.get<any>("/api/products", {
      params: {
        search: search?.trim(),
        limit: 50, // Get more products to find variants
      },
    });

    if (response.data.success) {
      const allVariants: Variant[] = [];
      
      response.data.data.forEach((product: any) => {
        // Only process variants if product_ids filter is provided
        if (productIds && productIds.length > 0 && !productIds.includes(product._id)) {
          return;
        }
        
        // Extract variants from variant products
        if (product.product_structure === 'variant' && product.product_variants) {
          product.product_variants.forEach((variant: any) => {
            // Only include published variants
            if (variant.published) {
              allVariants.push({
                _id: variant._id,
                name: variant.name,
                sku: variant.sku,
                selling_price: variant.selling_price,
                stock: variant.stock,
                status: variant.status,
                published: variant.published,
                product_id: product._id,
                product_name: product.name,
                displayName: `${product.name} - ${variant.name} (${variant.sku})`,
              });
            }
          });
        }
      });
      
      return allVariants;
    }

    return [];
  } catch (error) {
    console.error("Error fetching variants:", error);
    return [];
  }
};
