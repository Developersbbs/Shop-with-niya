import axiosInstance from "@/helpers/axiosInstance";

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price?: number;
  categories?: Array<{
    category: string;
    subcategories: string[];
    _id: string;
  }>;
  images?: string[];
  sku?: string;
  stock?: number;
  product_structure?: 'simple' | 'variant';
  product_variants?: Array<{
    _id: string;
    name: string;
    sku: string;
    selling_price: number;
    stock: number;
    status: string;
    published: boolean;
  }>;
  displayName: string;
}

export interface ProductSearchResponse {
  success: boolean;
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export const fetchProductsDropdown = async (search?: string): Promise<Product[]> => {
  try {
    const response = await axiosInstance.get<ProductSearchResponse>("/api/products", {
      params: {
        search: search?.trim(),
        limit: 20, // Limit results for dropdown
        exclude_combo: true, // Exclude combo products
      },
    });

    if (response.data.success) {
      return response.data.data.map(product => {
        // Get category name from first category if exists
        const categoryName = product.categories && product.categories.length > 0 
          ? `Category ${product.categories[0].category}` 
          : '';
        
        // For variant products, use main product info
        const displayName = product.product_structure === 'variant'
          ? `${product.name} (Variant Product)${categoryName ? ` • ${categoryName}` : ''}`
          : `${product.name}${product.sku ? ` (${product.sku})` : ''}${categoryName ? ` • ${categoryName}` : ''}`;

        return {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          categories: product.categories,
          images: product.images,
          sku: product.sku,
          stock: product.stock,
          product_structure: product.product_structure,
          product_variants: product.product_variants,
          displayName,
        };
      });
    }

    return [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};
