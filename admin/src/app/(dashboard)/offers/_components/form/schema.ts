import * as z from "zod";

const MAX_FILE_SIZE_MB = 3;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // 3MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const fileSchema = z
  .instanceof(File, { message: "Offer image is required" })
  .refine(
    (file) => file.size <= MAX_FILE_SIZE,
    `File size must be less than ${MAX_FILE_SIZE_MB}MB`
  )
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png and .webp formats are supported"
  );

// BOGO Configuration Schema
const bogoConfigSchema = z.object({
  buy: z.object({
    scope: z.enum(['product', 'category']),
    product_ids: z.array(z.string()).optional(),
    category_ids: z.array(z.string()).optional(),
    quantity: z.number().min(1),
  }),
  get: z.object({
    scope: z.enum(['same', 'product', 'category']),
    product_ids: z.array(z.string()).optional(),
    category_ids: z.array(z.string()).optional(),
    quantity: z.number().min(1),
    discount_type: z.enum(['FREE', 'PERCENT']),
    discount_value: z.number().min(0).max(100).optional(),
  }),
  apply_to: z.enum(['cheapest', 'first_matched']).default('cheapest'),
  max_free_quantity: z.number().min(1).default(1),
}).superRefine((data, ctx) => {
  // Buy scope validation
  if (data.buy.scope === 'product' && (!data.buy.product_ids || data.buy.product_ids.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one product is required when buy scope is product',
      path: ['buy.product_ids'],
    });
  }
  if (data.buy.scope === 'category' && (!data.buy.category_ids || data.buy.category_ids.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one category is required when buy scope is category',
      path: ['buy.category_ids'],
    });
  }

  // Get scope validation
  if (data.get.scope === 'product' && (!data.get.product_ids || data.get.product_ids.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one product is required when get scope is product',
      path: ['get.product_ids'],
    });
  }
  if (data.get.scope === 'category' && (!data.get.category_ids || data.get.category_ids.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one category is required when get scope is category',
      path: ['get.category_ids'],
    });
  }

  // Discount type validation
  if (data.get.discount_type === 'FREE') {
    if (data.get.discount_value !== undefined && data.get.discount_value !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount value must be 100 for FREE discount type',
        path: ['get.discount_value'],
      });
    }
  } else if (data.get.discount_type === 'PERCENT') {
    if (!data.get.discount_value || data.get.discount_value <= 0 || data.get.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount value must be between 1 and 100 for PERCENT discount type',
        path: ['get.discount_value'],
      });
    }
  }

  // Auto-set and hide irrelevant fields when get.scope === "same"
  if (data.get.scope === 'same') {
    // Clear product_ids and category_ids when scope is same
    if (data.get.product_ids && data.get.product_ids.length > 0) {
      data.get.product_ids = [];
    }
    if (data.get.category_ids && data.get.category_ids.length > 0) {
      data.get.category_ids = [];
    }
  }
});

// Flash Sale Configuration Schema  
const flashConfigSchema = z.object({
  discount_type: z.enum(["percentage", "fixed"]).optional(),
  discount_value: z.number().min(0).optional(),
  max_discount: z.number().min(0).optional(),
  applicable_products: z.array(z.string()).optional(),
  applicable_categories: z.array(z.string()).optional(),
  customer_groups: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // Only validate if discount_type is provided and discount_value is greater than 0
    if (data.discount_type && data.discount_value && data.discount_value > 0) {
      if (data.discount_type === "percentage") {
        return data.max_discount !== undefined && data.max_discount > 0 && data.discount_value <= 100;
      }
      return true;
    }
    return true; // Skip validation if not provided or discount_value is 0 (for drafts)
  },
  {
    message: "Invalid discount configuration",
    path: ["discount_value"],
  }
);

// Category Discount Configuration Schema
const categoryConfigSchema = z.object({
  categories: z.array(z.string()).optional(),
  discount_type: z.enum(["percentage", "fixed"]).optional(),
  discount_value: z.number().min(0).optional(),
  max_discount: z.number().min(0).optional(),
  customer_groups: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // Only validate if discount_type is provided and discount_value is greater than 0
    if (data.discount_type && data.discount_value && data.discount_value > 0) {
      if (data.discount_type === "percentage") {
        return data.max_discount !== undefined && data.max_discount > 0 && data.discount_value <= 100;
      }
      return true;
    }
    return true; // Skip validation if not provided or discount_value is 0 (for drafts)
  },
  {
    message: "Invalid discount configuration",
    path: ["discount_value"],
  }
).refine(
  (data) => {
    // Only require categories if discount_type is provided and discount_value > 0
    if (data.discount_type && data.discount_value && data.discount_value > 0) {
      return data.categories && data.categories.length > 0;
    }
    return true; // Skip validation if not provided (for drafts)
  },
  {
    message: "At least one category is required for category discounts",
    path: ["categories"],
  }
);

// Store-wide Configuration Schema
const storewideConfigSchema = z.object({
  discount_type: z.enum(["percentage", "fixed"]).optional(),
  discount_value: z.number().min(0).optional(),
  max_discount: z.number().min(0).optional(),
  customer_groups: z.array(z.string()).optional(),
  exclude_products: z.array(z.string()).optional(),
  exclude_categories: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // Only validate if discount_type is provided and discount_value is greater than 0
    if (data.discount_type && data.discount_value && data.discount_value > 0) {
      if (data.discount_type === "percentage") {
        return data.max_discount !== undefined && data.max_discount > 0 && data.discount_value <= 100;
      }
      return true;
    }
    return true; // Skip validation if not provided or discount_value is 0 (for drafts)
  },
  {
    message: "Invalid discount configuration",
    path: ["discount_value"],
  }
);

// Main Offer Form Schema
export const offerFormSchema = z.object({
  title: z.string().min(1, "Offer title is required"),
  slug: z.string().optional(), // Made optional for draft saving
  description: z.string().optional(),
  image_url: z.union([z.string(), z.instanceof(File)]).optional(),
  banner_image: z.union([z.string(), z.instanceof(File)]).optional(),
  offer_type: z.enum(["bogo", "flash", "category_discount", "storewide"]).optional(), // Made optional for draft saving
  priority: z.number().min(1, "Priority must be at least 1").max(100, "Priority must be at most 100").optional(), // Made optional
  auto_apply: z.boolean().default(false),
  published: z.boolean().default(false), // Added published field
  start_date: z.string().optional(), // Made optional for draft saving
  end_date: z.string().optional(), // Made optional for draft saving
  usage_limit: z.number().min(1, "Usage limit must be at least 1").optional(),
  limit_per_user: z.number().min(1, "Limit per user must be at least 1").optional(),
  allow_guest_users: z.boolean().default(true),
  applicable_users: z.array(z.string()).default([]),
  excluded_users: z.array(z.string()).default([]),
  // Configuration based on offer type
  bogo_config: bogoConfigSchema.optional(),
  flash_config: flashConfigSchema.optional(),
  category_config: categoryConfigSchema.optional(),
  storewide_config: storewideConfigSchema.optional(),
}).refine((data) => {
  // Validate that at least one config is provided based on offer type
  switch (data.offer_type) {
    case "bogo":
      return !!data.bogo_config;
    case "flash":
      return !!data.flash_config;
    case "category_discount":
      return !!data.category_config;
    case "storewide":
      return !!data.storewide_config;
    default:
      return false;
  }
}, {
  message: "Configuration is required for the selected offer type",
  path: ["offer_type"],
}).refine((data) => {
  // Validate date range only if both dates are provided
  if (data.start_date && data.end_date) {
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);
    return startDate < endDate;
  }
  return true; // Skip validation if dates are not provided
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

export type OfferFormData = z.infer<typeof offerFormSchema>;
