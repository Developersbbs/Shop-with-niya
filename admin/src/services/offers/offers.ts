import axiosInstance from "@/helpers/axiosInstance";

// Types
export interface Offer {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  image_url?: string;
  banner_image?: string;
  offer_type: "bogo" | "flash" | "category_discount" | "storewide";
  priority: number;
  status: "draft" | "active" | "disabled";
  auto_apply: boolean;
  start_date: string;
  end_date: string;
  usage_limit?: number;
  used_count: number;
  limit_per_user?: number;
  allow_guest_users: boolean;
  is_active: boolean;
  published: boolean;
  applicable_users: string[];
  excluded_users: string[];
  user_segments: string[];
  bogo_config?: Record<string, unknown>;
  flash_config?: Record<string, unknown>;
  category_config?: Record<string, unknown>;
  storewide_config?: Record<string, unknown>;
  analytics: {
    views: number;
    cart_attempts: number;
    applied_success: number;
    total_discount_given: number;
    total_revenue_impact: number;
    conversion_rate: number;
    last_updated: string;
  };
  created_by: string;
  last_updated_by?: string;
  tags: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FetchOffersParams {
  page?: number;
  limit?: number;
  search?: string;
  offerType?: string;
  status?: string;
  priority?: string;
  usageThreshold?: string;
  sortBy?: string;
  order?: string;
}

export interface OffersResponse {
  success: boolean;
  data: Offer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    prev?: number;
    next?: number;
  };
}

export interface CreateOfferParams {
  title: string;
  slug?: string;
  description?: string;
  image_url?: string;
  banner_image?: string;
  offer_type?: "bogo" | "flash" | "category_discount" | "storewide";
  priority?: number;
  auto_apply?: boolean;
  start_date?: string;
  end_date?: string;
  usage_limit?: number;
  limit_per_user?: number;
  allow_guest_users?: boolean;
  applicable_users?: string[];
  excluded_users?: string[];
  user_segments?: string[];
  included_categories?: string[];
  included_subcategories?: string[];
  included_products?: string[];
  excluded_categories?: string[];
  excluded_subcategories?: string[];
  excluded_products?: string[];
  excluded_brands?: string[];
  exclude_out_of_stock?: boolean;
  bogo_config?: Record<string, unknown>;
  flash_config?: Record<string, unknown>;
  category_config?: Record<string, unknown>;
  storewide_config?: Record<string, unknown>;
  tags?: string[];
  notes?: string;
}

export interface UpdateOfferParams extends Partial<CreateOfferParams> {
  id: string;
}

export interface BulkUpdateParams {
  ids: string[];
  action: "activate" | "deactivate" | "delete" | "priority";
  data?: {
    priority?: number;
  };
}

// API Functions
export const fetchOffers = async (params: FetchOffersParams = {}): Promise<OffersResponse> => {
  const {
    page = 1,
    limit = 10,
    search,
    offerType,
    status,
    priority,
    usageThreshold,
    sortBy = "priority",
    order = "desc",
  } = params;

  const queryParams = new URLSearchParams();

  if (page) queryParams.append("page", page.toString());
  if (limit) queryParams.append("limit", limit.toString());
  if (search) queryParams.append("search", search);
  if (offerType) queryParams.append("offerType", offerType);
  if (status) queryParams.append("status", status);
  if (priority) queryParams.append("priority", priority);
  if (usageThreshold) queryParams.append("usageThreshold", usageThreshold);
  if (sortBy) queryParams.append("sort", sortBy);
  if (order) queryParams.append("order", order);

  const response = await axiosInstance.get(`/api/offers?${queryParams.toString()}`);
  return response.data;
};

export const fetchOffer = async (id: string): Promise<{ success: boolean; data: Offer }> => {
  const response = await axiosInstance.get(`/api/offers/${id}`);
  return response.data;
};

export const createOffer = async (params: CreateOfferParams): Promise<{ success: boolean; data: Offer }> => {
  const response = await axiosInstance.post("/api/offers", params);
  return response.data;
};

export const updateOffer = async (params: UpdateOfferParams): Promise<{ success: boolean; data: Offer }> => {
  const { id, ...updateData } = params;
  const response = await axiosInstance.put(`/api/offers/${id}`, updateData);
  return response.data;
};

export const deleteOffer = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.delete(`/api/offers/${id}`);
  return response.data;
};

export const bulkUpdateOffers = async (params: BulkUpdateParams): Promise<{
  success: boolean;
  message: string;
  modifiedCount?: number;
  deletedCount?: number;
}> => {
  const response = await axiosInstance.put("/api/offers/bulk", params);
  return response.data;
};

export const toggleOfferStatus = async (id: string): Promise<{
  success: boolean;
  data: Offer;
  message: string;
}> => {
  const response = await axiosInstance.post(`/api/offers/${id}/toggle-status`);
  return response.data;
};

export const getActiveOffers = async (): Promise<{ success: boolean; data: Offer[] }> => {
  const response = await axiosInstance.get("/api/offers/active");
  return response.data;
};

export const getOfferBySlug = async (slug: string): Promise<{ success: boolean; data: Offer }> => {
  const response = await axiosInstance.get(`/api/offers/slug/${slug}`);
  return response.data;
};

export const getOfferAnalytics = async (
  id: string,
  params?: { startDate?: string; endDate?: string; granularity?: "daily" | "hourly" }
): Promise<{ success: boolean; data: Record<string, unknown> }> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.granularity) queryParams.append("granularity", params.granularity);

  const response = await axiosInstance.get(`/api/offers/${id}/analytics?${queryParams.toString()}`);
  return response.data;
};

export const exportOffersCSV = async (params: FetchOffersParams = {}): Promise<Blob> => {
  const {
    search,
    offerType,
    status,
    priority,
    usageThreshold,
  } = params;

  const queryParams = new URLSearchParams();

  if (search) queryParams.append("search", search);
  if (offerType) queryParams.append("offerType", offerType);
  if (status) queryParams.append("status", status);
  if (priority) queryParams.append("priority", priority);
  if (usageThreshold) queryParams.append("usageThreshold", usageThreshold);

  const response = await axiosInstance.get(`/api/offers/export/csv?${queryParams.toString()}`, {
    responseType: 'blob'
  });
  return response.data;
};

// Cart Integration Functions
export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface ApplyOffersParams {
  cart: Cart;
  userId?: string;
  ipAddress?: string;
}

export interface OfferApplication {
  offerId: string;
  offerType: string;
  title: string;
  discountAmount: number;
  freeItems?: Array<{
    productId: string;
    quantity: number;
    discount: number;
  }>;
  discountedItems?: Array<{
    productId: string;
    quantity: number;
    discount: number;
  }>;
}

export interface ApplyOffersResponse {
  success: boolean;
  data: {
    appliedOffers: OfferApplication[];
    totalDiscount: number;
    originalTotal: number;
    discountedTotal: number;
  };
}

export interface RevalidateOffersParams extends ApplyOffersParams {
  currentOffers: Array<{ offerId: string }>;
}

export interface RevalidateOffersResponse {
  success: boolean;
  data: {
    validOffers: OfferApplication[];
    invalidOffers: Array<{
      offerId: string;
      reason: string;
    }>;
  };
}

export const applyOffers = async (params: ApplyOffersParams): Promise<ApplyOffersResponse> => {
  const response = await axiosInstance.post("/api/offers/apply-offers", params);
  return response.data;
};

export const revalidateOffers = async (params: RevalidateOffersParams): Promise<RevalidateOffersResponse> => {
  const response = await axiosInstance.post("/api/offers/revalidate-offers", params);
  return response.data;
};
