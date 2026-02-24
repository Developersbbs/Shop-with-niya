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
  .instanceof(File, { message: "Invalid file type" })
  .refine(
    (file) => file.size <= MAX_FILE_SIZE,
    `File size must be less than ${MAX_FILE_SIZE_MB}MB`
  )
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png and .webp formats are supported"
  );

const categorySubcategorySelectionSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string().optional(),
  subcategoryIds: z.array(z.string()).default([]),
  subcategoryNames: z.array(z.string()).default([]),
});

const visibilitySchema = z.object({
  showOnCheckout: z.boolean().default(true),
  showOnHomepage: z.boolean().default(false),
  showOnProductPage: z.boolean().default(false),
  showInCart: z.boolean().default(true),
});

const bogoConfigSchema = z
  .object({
    buyQuantity: z.coerce.number().min(1).default(1),
    getQuantity: z.coerce.number().min(1).default(1),
    buyProducts: z.array(z.string()).default([]),
    getProducts: z.array(z.string()).default([]),
    buyCategories: z.array(z.string()).default([]),
    getCategories: z.array(z.string()).default([]),
  })
  .partial();

export const couponFormSchema = z
  .object({
    campaignName: z
      .string()
      .min(1, { message: "Campaign name is required" })
      .max(100, "Campaign name must be 100 characters or less"),
    code: z
      .string()
      .min(1, { message: "Campaign code is required" })
      .regex(/^[A-Z0-9_-]+$/, {
        message: "Code must contain only capital letters, numbers, hyphen or underscore",
      })
      .max(50, "Campaign code must be 50 characters or less"),
    description: z.string().max(500).optional().or(z.literal("")),
    image: z.union([
  z.instanceof(File, { message: "Invalid file type" })
    .refine((file) => file.size <= MAX_FILE_SIZE, `File size must be less than ${MAX_FILE_SIZE_MB}MB`)
    .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), "Only .jpg, .jpeg, .png and .webp formats are supported"),
  z.string().url().optional(),
  z.null().optional()
]).optional(),
    discountType: z.enum([
      "percentage",
      "fixed",
      "free_shipping",
      "cashback",
      "bogo",
    ]),
    discountValue: z.coerce
      .number({ invalid_type_error: "Discount value must be a number" })
      .min(0, { message: "Discount value must be greater than or equal to 0" })
      .optional(),
    cashbackAmount: z
      .coerce
      .number({ invalid_type_error: "Cashback amount must be a number" })
      .min(0, { message: "Cashback amount must be greater than or equal to 0" })
      .optional(),
    minPurchase: z
      .coerce
      .number({ invalid_type_error: "Minimum purchase must be a number" })
      .min(0, { message: "Minimum purchase cannot be negative" })
      .default(0),
    maxDiscount: z
      .coerce
      .number({ invalid_type_error: "Max discount must be a number" })
      .min(0, { message: "Max discount cannot be negative" })
      .optional(),
    usageLimit: z.coerce.number().min(1).optional(),
    limitPerUser: z.coerce.number().min(1).optional(),
    startDate: z.date(),
    endDate: z.date(),
    isActive: z.boolean().default(true),
    published: z.boolean().default(true),
    autoApply: z.boolean().default(false),
    firstOrderOnly: z.boolean().default(false),
    newUserOnly: z.boolean().default(false),
    priority: z
      .coerce
      .number({ invalid_type_error: "Priority must be a number" })
      .min(0, { message: "Priority cannot be negative" })
      .default(0),
    applicableCategories: z.array(categorySubcategorySelectionSchema).default([]),
    applicableProducts: z.array(z.string()).default([]),
    applicableVariants: z.array(z.string()).default([]),
    applicableUsers: z.array(z.string()).default([]),
    excludedCategories: z.array(categorySubcategorySelectionSchema).default([]),
    excludedProducts: z.array(z.string()).default([]),
    excludedVariants: z.array(z.string()).default([]),
    visibilityOptions: visibilitySchema,
    bogoConfig: bogoConfigSchema.optional(),
  })
  .refine((data) => {
    console.log("Date validation:", {
      startDate: data.startDate,
      endDate: data.endDate,
      comparison: data.endDate >= data.startDate
    });
    // Allow same date as long as end time is after or equal to start time
    return data.endDate >= data.startDate;
  }, {
    message: "End date/time must be after or equal to start date/time",
    path: ["endDate"],
  })
  .refine((data) => {
    console.log("Start time validation:", {
      startDate: data.startDate,
      currentTime: new Date(),
      comparison: data.startDate >= new Date()
    });
    // Start time must be equal to or greater than current time
    return data.startDate >= new Date();
  }, {
    message: "Start date/time must be equal to or greater than current time",
    path: ["startDate"],
  })
  .superRefine((data, ctx) => {
    console.log("SuperRefine validation data:", {
      discountType: data.discountType,
      discountValue: data.discountValue,
      cashbackAmount: data.cashbackAmount,
      bogoConfig: data.bogoConfig
    });
    
    if (data.discountType === "percentage") {
      if (!data.discountValue || data.discountValue <= 0) {
        console.log("Percentage discount validation failed:", data.discountValue);
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Percentage discount must have a value",
          path: ["discountValue"],
        });
      }
      if (data.discountValue && data.discountValue > 100) {
        console.log("Percentage discount exceeds 100:", data.discountValue);
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Percentage discount cannot exceed 100%",
          path: ["discountValue"],
        });
      }
    }

    if (data.discountType === "fixed" && (!data.discountValue || data.discountValue <= 0)) {
      console.log("Fixed discount validation failed:", data.discountValue);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fixed discount must be greater than 0",
        path: ["discountValue"],
      });
    }

    if (data.discountType === "cashback" && (!data.cashbackAmount || data.cashbackAmount <= 0)) {
      console.log("Cashback validation failed:", data.cashbackAmount);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cashback amount must be greater than 0",
        path: ["cashbackAmount"],
      });
    }

    if (data.discountType === "bogo") {
      const cfg = data.bogoConfig;
      if (!cfg || !cfg.buyQuantity || !cfg.getQuantity) {
        console.log("BOGO validation failed:", cfg);
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "BOGO configuration requires buy and get quantities",
          path: ["bogoConfig"],
        });
      }
    }
  });

export const couponBulkFormSchema = z.object({
    published: z.coerce.boolean(),
    isActive: z.coerce.boolean().optional(),
});

export type CouponFormData = z.infer<typeof couponFormSchema>;
export type CouponBulkFormData = z.infer<typeof couponBulkFormSchema>;
