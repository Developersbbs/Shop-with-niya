// Base API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface User {
  _id: string;
  id: string;
  email: string;
  name: string;
  role: string | { name: string; display_name: string; is_default: boolean };
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Category Types
export interface Subcategory {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  category_id: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  subcategories?: Subcategory[];
}

export interface CategoryDropdown {
  _id: string;
  id: string;
  name: string;
  slug: string;
}

// Product Types
export interface ProductCategoryInfo {
    category: {
      _id: string;
      name: string;
      slug: string;
    };
    subcategories: {
      _id: string;
      name: string;
    }[];
  }

export interface Product {
  _id: string;
  id: string;
  name: string;
  category_id?: string | { _id: string; name: string; slug: string }; // Keep for backward compatibility
  categories: ProductCategoryInfo[];
  product_type?: string;
  product_structure?: 'simple' | 'variant'; // Add this field for simple vs variant products
  description?: string;
  image_url?: string[];
  sku: string; // Required base SKU
  slug: string;
  cost_price: number;
  selling_price: number;
  baseStock?: number | null; // Base stock level - can be null if not set
  minStock?: number; // Minimum stock threshold
  published: boolean; // Manual publish status by admin
  status?: 'published' | 'out_of_stock' | 'draft' | 'archived'; // Computed stock-based status
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_slug?: string;
  subcategory_names?: string[];
  subcategories?: string[];
  tags?: string[];
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonical?: string;
    robots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  variants?: any[];
  product_variants?: any[];
  // Digital product fields
  file_path?: string;
  file_size?: number;
  download_format?: string;
  license_type?: string;
  download_limit?: number;
}

export interface ProductDetails extends Product {
  categories: ProductCategoryInfo[];
}

// Customer Types
export interface Customer {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

// Order Types
export interface Order {
  _id: string;
  id: string;
  customer_id: string;
  invoice_no: string;
  order_time: string | Date;
  payment_method: string;
  shipping_cost: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'dispatched' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address?: {
    name: string;
    email: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_status: string;
  tracking_number?: string;
  estimated_delivery?: string;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  customers?: {
    name: string;
    address: string;
    phone: string;
  };
  order_items?: OrderItem[];
}

export interface OrderItem {
  _id: string;
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

// Coupon Types
export type DiscountType =
  | 'percentage'
  | 'fixed'
  | 'free_shipping'
  | 'cashback'
  | 'bogo';

export interface CouponAnalytics {
  views: number;
  clicks: number;
  apply_attempts: number;
  apply_success: number;
  total_revenue_impact: number;
  total_discount_given: number;
  conversion_rate: number;
  last_updated: string;
}

export interface CouponUsageEntry {
  user_id: string;
  used_at: string;
  order_id: string;
  discount_amount: number;
  original_total: number;
  final_total: number;
}

export interface BogoConfig {
  buy_quantity?: number;
  get_quantity?: number;
  buy_products?: string[];
  get_products?: string[];
  buy_categories: string[];
  buy_subcategories?: string[];
  get_categories: string[];
  get_subcategories?: string[];
}

export interface CouponVisibilityOptions {
  show_on_checkout: boolean;
  show_on_homepage: boolean;
  show_on_product_page: boolean;
  show_in_cart: boolean;
}

export interface Coupon {
  _id: string;
  campaign_name: string;
  code: string;
  description?: string;
  image_url?: string | null;
  discount_type: DiscountType;
  discount_value?: number;
  cashback_amount?: number;
  min_purchase?: number;
  max_discount?: number;
  usage_limit?: number | null;
  used_count: number;
  limit_per_user?: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  published: boolean;
  auto_apply: boolean;
  first_order_only: boolean;
  new_user_only: boolean;
  priority: number;
  applicable_categories: string[];
  applicable_subcategories?: string[];
  applicable_products: string[];
  applicable_users: string[];
  excluded_categories: string[];
  excluded_subcategories?: string[];
  excluded_products: string[];
  visibility_options: CouponVisibilityOptions;
  bogo_config?: BogoConfig;
  analytics: CouponAnalytics;
  usage_history: CouponUsageEntry[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

// Staff Types
export interface Staff {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  image_url?: string;
  role_id: string | { name: string; display_name: string; is_default: boolean };
  is_active: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
  staff_roles?: StaffRole;
}

export interface StaffRole {
  _id: string;
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// Notification Types
export interface Notification {
  _id: string;
  title: string;
  type: "new_order" | "low_stock" | "out_of_stock";
  image_url?: string;
  is_read: boolean;
  published: boolean;
  staff_id: string;
  created_at: string;
}

// Inventory Log Types
export interface InventoryLog {
  _id: string;
  id: string;
  product_id: string;
  change_type: 'increase' | 'decrease';
  quantity_changed: number;
  reason: string;
  created_at: string;
  product?: Product;
}

// Dashboard Stats
export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  recentOrders: Order[];
  topProducts: Product[];
  salesChart: {
    labels: string[];
    data: number[];
  };
}
