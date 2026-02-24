import { Product, Category, Coupon, Customer, Staff } from "@/types/api";

type ValidationErrorsResponse = {
  validationErrors: Record<string, string>;
};

type DbErrorResponse = {
  dbError: string;
};

type SuccessResponse = {
  success: boolean;
  message?: string;
};

type ErrorResponse = {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
};

// Enhanced response types with message and errors support
type EnhancedErrorResponse = {
  success: false;
  message: string;
  errors: Record<string, string[]>;
};

type EnhancedSuccessResponse<T = any> = {
  success: true;
  message: string;
  data?: T;
};

export type ServerActionResponse = DbErrorResponse | SuccessResponse | ErrorResponse;

export type VServerActionResponse =
  | ValidationErrorsResponse
  | ServerActionResponse
  | ErrorResponse;

// Generic enhanced server action response
export type EnhancedServerActionResponse<T = any> = 
  | EnhancedErrorResponse
  | EnhancedSuccessResponse<T>;

export type ProductServerActionResponse =
  | ValidationErrorsResponse
  | DbErrorResponse
  | (SuccessResponse & {
      product?: Product;
      stockValidation?: {
        message: string;
        stockInfo: string;
        requiredAction: string;
      };
    });

export type CategoryServerActionResponse =
  | ValidationErrorsResponse
  | DbErrorResponse
  | (SuccessResponse & {
      category: Category;
    });

export type CouponServerActionResponse =
  | ValidationErrorsResponse
  | DbErrorResponse
  | SuccessResponse
  | ErrorResponse
  | (SuccessResponse & {
      coupon: Coupon;
    });

export type CustomerServerActionResponse =
  | ValidationErrorsResponse
  | DbErrorResponse
  | (SuccessResponse & {
      customer: Customer;
    });

export type StaffServerActionResponse =
  | ValidationErrorsResponse
  | DbErrorResponse
  | (SuccessResponse & {
      staff: Staff;
    });

export type ProfileServerActionResponse =
  | ValidationErrorsResponse
  | DbErrorResponse
  | SuccessResponse;
