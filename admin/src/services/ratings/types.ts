
export interface Rating {
    _id: string;
    customer_id: {
        _id: string;
        name: string;
        email: string;
    };
    product_id: {
        _id: string;
        name: string;
        slug: string;
        image_url: string[];
    };
    rating: number;
    review?: string;
    verified_purchase: boolean;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface RatingsResponse {
    success: boolean;
    data: Rating[];
    pagination: {
        total: number;
        page: number;
        pages: number;
    };
}

export interface FetchRatingsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}
