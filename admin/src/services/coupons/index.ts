import {
  Coupon,
  PaginatedResponse,
} from "@/types/api";

export interface FetchCouponsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function fetchCoupons({
  page = 1,
  limit = 10,
  search,
}: FetchCouponsParams): Promise<PaginatedResponse<Coupon>> {
  const params = new URLSearchParams();
  
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  if (search) params.append('search', search);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/coupons?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch coupons');
  }
  
  return response.json();
}
