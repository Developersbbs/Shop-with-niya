const express = require("express");
const { body, validationResult, param, query } = require("express-validator");
const { ObjectId } = require("mongodb");
const Coupon = require("../models/Coupon");

const router = express.Router();

const buildFilterQuery = (filters) => {
  const {
    search,
    discountType,
    status,
    published,
    autoApply,
    visibility,
    startDate,
    endDate,
    categoryId,
    productId,
  } = filters;

  const query = {};

  if (search) {
    query.$or = [
      { code: { $regex: search, $options: "i" } },
      { campaign_name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (discountType) {
    query.discount_type = discountType;
  }

  if (typeof published !== "undefined") {
    query.published = published === "true";
  }

  if (typeof autoApply !== "undefined") {
    query.auto_apply = autoApply === "true";
  }

  if (status === "active") {
    query.is_active = true;
  } else if (status === "inactive") {
    query.is_active = false;
  } else if (status === "expired") {
    query.end_date = { $lt: new Date() };
  } else if (status === "upcoming") {
    query.start_date = { $gt: new Date() };
  }

  if (startDate || endDate) {
    query.start_date = query.start_date || {};
    query.end_date = query.end_date || {};

    if (startDate) {
      query.start_date.$gte = new Date(startDate);
    }

    if (endDate) {
      query.end_date.$lte = new Date(endDate);
    }
  }

  if (categoryId) {
    query.$or = query.$or || [];
    query.$or.push({ applicable_categories: categoryId });
  }

  if (productId) {
    query.$or = query.$or || [];
    query.$or.push({ applied_products: productId });
  }

  if (visibility) {
    const visibilityKey = `visibility_options.${visibility}`;
    query[visibilityKey] = true;
  }

  return query;
};

const validationRules = [
  body("campaign_name")
    .trim()
    .notEmpty()
    .withMessage("Campaign name is required"),
  body("code")
    .trim()
    .toUpperCase()
    .matches(/^[A-Z0-9_-]{3,50}$/)
    .withMessage("Coupon code must be alphanumeric (A-Z, 0-9, -, _)"),
  body("discount_type")
    .isIn(["percentage", "fixed", "free_shipping", "cashback", "bogo"])
    .withMessage("Invalid discount type"),
  body("discount_value")
    .if((value, { req }) => ["percentage", "fixed"].includes(req.body.discount_type))
    .isFloat({ gt: 0 })
    .withMessage("Discount value must be greater than 0"),
  body("cashback_amount")
    .if((value, { req }) => req.body.discount_type === "cashback")
    .isFloat({ gt: 0 })
    .withMessage("Cashback amount must be greater than 0"),
  body("max_discount")
    .optional({ nullable: true })
    .isFloat({ gt: 0 })
    .withMessage("Max discount must be greater than 0"),
  body("min_purchase")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Minimum purchase must be 0 or more"),
  body("usage_limit")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Usage limit must be a positive integer"),
  body("limit_per_user")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("Limit per user must be a positive integer"),
  body("start_date")
    .isISO8601()
    .toDate()
    .withMessage("Start date is required"),
  body("end_date")
    .isISO8601()
    .toDate()
    .withMessage("End date is required")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.start_date)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
  body("applicable_categories")
    .optional()
    .isArray()
    .withMessage("Applicable categories must be an array")
    .custom(async (value, { req }) => {
      if (Array.isArray(value) && value.length > 0) {
        // Extract category IDs from the data structure
        const categoryIds = value.map(item => 
          typeof item === 'string' ? item : (item.categoryId || item.category || item._id)
        ).filter(Boolean);
        
        // Check if all category IDs are valid and active
        const Category = require("../models/Category");
        const validCategories = await Category.find({ 
          _id: { $in: categoryIds }, 
          published: true 
        }).select('_id').lean();
        
        if (validCategories.length !== categoryIds.length) {
          throw new Error("Some selected categories are invalid or inactive");
        }
        
                
        // Check subcategories from both the new structure and the old separate field
        const allSubcategoryIds = [];
        
        // Check subcategories within the category objects
        value.forEach(item => {
          if (item && typeof item === 'object') {
            if (item.subcategories) {
              allSubcategoryIds.push(...item.subcategories);
            } else if (item.subcategoryIds) {
              allSubcategoryIds.push(...item.subcategoryIds);
            }
          }
        });
        
        // Also check the separate applicable_subcategories field if it exists
        if (req.body.applicable_subcategories && Array.isArray(req.body.applicable_subcategories)) {
          allSubcategoryIds.push(...req.body.applicable_subcategories);
        }
        
        if (allSubcategoryIds.length > 0) {
          const Subcategory = require("../models/Subcategory");
          const validSubcategories = await Subcategory.find({
            _id: { $in: allSubcategoryIds },
            published: true,
          }).select("_id").lean();
          
          if (validSubcategories.length !== allSubcategoryIds.length) {
            throw new Error("Some selected subcategories are invalid or inactive");
          }
        }
      }
      return true;
    }),
    body("excluded_categories")
    .optional()
    .isArray()
    .withMessage("Excluded categories must be an array")
    .custom(async (value, { req }) => {
      if (Array.isArray(value) && value.length > 0) {
        // Extract category IDs from the data structure
        const categoryIds = value.map(item => 
          typeof item === 'string' ? item : (item.categoryId || item.category || item._id)
        ).filter(Boolean);
        
        // Check if all category IDs are valid and active
        const Category = require("../models/Category");
        const validCategories = await Category.find({ 
          _id: { $in: categoryIds }, 
          published: true 
        }).select('_id').lean();
        
        if (validCategories.length !== categoryIds.length) {
          throw new Error("Some excluded categories are invalid or inactive");
        }
        
        // Check subcategories from both the new structure and the old separate field
        const allSubcategoryIds = [];
        
        // Check subcategories within the category objects
        value.forEach(item => {
          if (item && typeof item === 'object') {
            if (item.subcategories) {
              allSubcategoryIds.push(...item.subcategories);
            } else if (item.subcategoryIds) {
              allSubcategoryIds.push(...item.subcategoryIds);
            }
          }
        });
        
        // Also check the separate excluded_subcategories field if it exists
        if (req.body.excluded_subcategories && Array.isArray(req.body.excluded_subcategories)) {
          allSubcategoryIds.push(...req.body.excluded_subcategories);
        }
        
        if (allSubcategoryIds.length > 0) {
          const Subcategory = require("../models/Subcategory");
          const validSubcategories = await Subcategory.find({
            _id: { $in: allSubcategoryIds },
            published: true,
          }).select("_id").lean();
          
          if (validSubcategories.length !== allSubcategoryIds.length) {
            throw new Error("Some excluded subcategories are invalid or inactive");
          }
        }
      }
      return true;
    }),
  body("applicableProducts")
    .optional()
    .isArray()
    .withMessage("Applied products must be an array")
    .custom(async (value) => {
      if (Array.isArray(value) && value.length > 0) {
        // Check if all product IDs are valid and published
        const Product = require("../models/Product");
        const validProducts = await Product.find({ 
          _id: { $in: value }, 
          published: true 
        }).select('_id name product_structure').lean();
        
        if (validProducts.length !== value.length) {
          throw new Error("Some selected products are invalid or inactive");
        }
      }
      return true;
    }),
  body("applicableVariants")
    .optional()
    .isArray()
    .withMessage("Applied variants must be an array")
    .custom(async (value) => {
      if (Array.isArray(value) && value.length > 0) {
        // Check if all variant IDs are valid and published
        const Product = require("../models/Product");
        const validVariantProducts = await Product.find({
          "product_variants._id": { $in: value },
          "product_variants.published": true
        }).select('_id product_variants').lean();
        
        // Extract all variant IDs from the found products
        const allVariantIds = validVariantProducts.reduce((ids, product) => {
          const variantIds = product.product_variants
            .filter(variant => value.includes(variant._id.toString()))
            .map(variant => variant._id.toString());
          return ids.concat(variantIds);
        }, []);
        
        if (allVariantIds.length !== value.length) {
          throw new Error("Some selected variants are invalid or inactive");
        }
      }
      return true;
    }),
    body("excludedProducts")
    .optional()
    .isArray()
    .withMessage("Excluded products must be an array")
    .custom(async (value) => {
      if (Array.isArray(value) && value.length > 0) {
        // Check if all product IDs are valid and published
        const Product = require("../models/Product");
        const validProducts = await Product.find({ 
          _id: { $in: value }, 
          published: true 
        }).select('_id name product_structure').lean();
        
        if (validProducts.length !== value.length) {
          throw new Error("Some excluded products are invalid or inactive");
        }
      }
      return true;
    }),
  body("excludedVariants")
    .optional()
    .isArray()
    .withMessage("Excluded variants must be an array")
    .custom(async (value) => {
      if (Array.isArray(value) && value.length > 0) {
        // Check if all variant IDs are valid and published
        const Product = require("../models/Product");
        const validVariantProducts = await Product.find({
          "product_variants._id": { $in: value },
          "product_variants.published": true
        }).select('_id product_variants').lean();
        
        // Extract all variant IDs from the found products
        const allVariantIds = validVariantProducts.reduce((ids, product) => {
          const variantIds = product.product_variants
            .filter(variant => value.includes(variant._id.toString()))
            .map(variant => variant._id.toString());
          return ids.concat(variantIds);
        }, []);
        
        if (allVariantIds.length !== value.length) {
          throw new Error("Some excluded variants are invalid or inactive");
        }
      }
      return true;
    }),
  body("bogo_config")
    .optional()
    .custom((value, { req }) => {
      if (req.body.discount_type === "bogo" && !value) {
        throw new Error("BOGO configuration is required for BOGO coupons");
      }
      return true;
    }),
];

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Backend - Validation errors:", errors.array());
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      errors: errors.array().reduce((acc, curr) => {
        acc[curr.path] = curr.msg;
        return acc;
      }, {}),
    });
  }
};

// GET /api/coupons
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("published").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const {
        page = 1,
        limit = 10,
        sort = "created_at",
        order = "desc",
        search,
        ...filters
      } = req.query;

      const query = buildFilterQuery({ search, ...filters });

      const [data, count] = await Promise.all([
        Coupon.find(query)
          .sort({ [sort]: order === "desc" ? -1 : 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Coupon.countDocuments(query),
      ]);

      res.json({
        data,
        meta: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("List coupons error", error);
      res.status(500).json({ success: false, error: "Failed to fetch coupons" });
    }
  }
);

// GET /api/coupons/:id
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid coupon id")],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const coupon = await Coupon.findById(req.params.id).lean();
      if (!coupon) {
        return res.status(404).json({ success: false, error: "Coupon not found" });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      console.error("Get coupon error", error);
      res.status(500).json({ success: false, error: "Failed to fetch coupon" });
    }
  }
);

// POST /api/coupons
router.post("/", validationRules, async (req, res) => {
  try {
    console.log("Backend - Received request body:", req.body);
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    const existing = await Coupon.findOne({ code: req.body.code.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Coupon code must be unique",
      });
    }

    // Enhanced date validation
    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);
    
    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        error: "End date must be after start date",
        details: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          message: "The coupon end date/time must be greater than the start date/time"
        }
      });
    }

    // Transform categories from frontend format to backend format
    const transformCategories = (categories, applicableSubcategories = []) => {
      if (!categories || !Array.isArray(categories)) return [];
      
      // If categories is an array of strings (category IDs)
      if (categories.every(cat => typeof cat === 'string')) {
        return categories.map((cat, index) => {
          // For the first category, add all subcategories
          // This is a fallback when frontend sends categories and subcategories separately
          return {
            category: cat,
            subcategories: index === 0 ? (applicableSubcategories || []) : []
          };
        });
      }
      
      return categories.map(cat => {
        // Handle frontend format: { categoryId, subcategoryIds }
        if (cat && typeof cat === 'object' && 'categoryId' in cat) {
          return {
            category: cat.categoryId,
            subcategories: Array.isArray(cat.subcategoryIds) ? cat.subcategoryIds : []
          };
        }
        // Handle backend format: { category, subcategories }
        if (cat && typeof cat === 'object' && ('category' in cat || '_id' in cat)) {
          return {
            category: cat.category || cat._id,
            subcategories: Array.isArray(cat.subcategories) ? cat.subcategories : []
          };
        }
        // If it's just an ID string
        if (typeof cat === 'string') {
          return {
            category: cat,
            subcategories: []
          };
        }
        // Invalid format, skip
        console.warn('Invalid category format:', cat);
        return null;
      }).filter(Boolean); // Remove any null entries from invalid formats
    };

    const couponData = {
      ...req.body,
      // Map frontend field names to backend schema field names
      applied_products: req.body.applicable_products || [],
      applied_variants: req.body.applicable_variants || [],
      excluded_products: req.body.excluded_products || [],
      excluded_variants: req.body.excluded_variants || [],
    };

    // Remove frontend field names after mapping
    delete couponData.applicable_products;
    delete couponData.applicable_variants;
    delete couponData.excluded_products;
    delete couponData.excluded_variants;

    // Transform categories if they exist in the request
    if (req.body.applicable_categories) {
      couponData.applicable_categories = transformCategories(
        req.body.applicable_categories, 
        req.body.applicable_subcategories
      );
    } else {
      couponData.applicable_categories = [];
    }
    
    if (req.body.excluded_categories) {
      couponData.excluded_categories = transformCategories(
        req.body.excluded_categories,
        req.body.excluded_subcategories
      );
    } else {
      couponData.excluded_categories = [];
    }

    // Remove old subcategory fields to prevent confusion
    delete couponData.applicable_subcategories;
    delete couponData.excluded_subcategories;

    if (req.body.bogo_config) {
      couponData.bogo_config = {
        ...req.body.bogo_config,
        buy_subcategories: req.body.bogo_config.buy_subcategories || [],
        get_subcategories: req.body.bogo_config.get_subcategories || [],
      };
    }

    const coupon = await Coupon.create(couponData);

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    console.error("Create coupon error", error);
    res.status(500).json({ success: false, error: "Failed to create coupon" });
  }
});

// PUT /api/coupons/bulk (bulk update published status)
router.put("/bulk", async (req, res) => {
  try {
    const { ids, published } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "No coupon IDs provided" 
      });
    }

    const objectIds = ids
      .map(id => {
        try { return new ObjectId(id); } 
        catch { return null; }
      })
      .filter(Boolean);

    if (objectIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "No valid IDs provided" 
      });
    }

    const result = await Coupon.updateMany(
      { _id: { $in: objectIds } },
      { $set: { published, updated_at: new Date() } }
    );

    res.json({ 
      success: true, 
      message: `${result.modifiedCount} coupons updated successfully`,
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error("Bulk update coupons error", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update coupons" 
    });
  }
});

// PUT /api/coupons/:id
router.put(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid coupon id"), ...validationRules],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      // Enhanced date validation
      const startDate = new Date(req.body.start_date);
      const endDate = new Date(req.body.end_date);
      
      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          error: "End date must be after start date",
          details: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            message: "The coupon end date/time must be greater than the start date/time"
          }
        });
      }

      // Transform categories from frontend format to backend format
      const transformCategories = (categories, applicableSubcategories = []) => {
        if (!categories || !Array.isArray(categories)) return [];
        
        // If categories is an array of strings (category IDs)
        if (categories.every(cat => typeof cat === 'string')) {
          return categories.map((cat, index) => {
            // For the first category, add all subcategories
            // This is a fallback when frontend sends categories and subcategories separately
            return {
              category: cat,
              subcategories: index === 0 ? (applicableSubcategories || []) : []
            };
          });
        }
        
        return categories.map(cat => {
          // Handle frontend format: { categoryId, subcategoryIds }
          if (cat && typeof cat === 'object' && 'categoryId' in cat) {
            return {
              category: cat.categoryId,
              subcategories: Array.isArray(cat.subcategoryIds) ? cat.subcategoryIds : []
            };
          }
          // Handle backend format: { category, subcategories }
          if (cat && typeof cat === 'object' && ('category' in cat || '_id' in cat)) {
            return {
              category: cat.category || cat._id,
              subcategories: Array.isArray(cat.subcategories) ? cat.subcategories : []
            };
          }
          // If it's just an ID string
          if (typeof cat === 'string') {
            return {
              category: cat,
              subcategories: []
            };
          }
          // Invalid format, skip
          console.warn('Invalid category format:', cat);
          return null;
        }).filter(Boolean); // Remove any null entries from invalid formats
      };

      const updatePayload = {
        ...req.body,
        // Map frontend field names to backend schema field names
        applied_products: req.body.applicable_products || [],
        applied_variants: req.body.applicable_variants || [],
        excluded_products: req.body.excluded_products || [],
        excluded_variants: req.body.excluded_variants || [],
        updated_at: new Date(),
      };

      // Remove frontend field names after mapping
      delete updatePayload.applicable_products;
      delete updatePayload.applicable_variants;
      delete updatePayload.excluded_products;
      delete updatePayload.excluded_variants;

      // Transform categories if they exist in the request
      if (req.body.applicable_categories) {
        updatePayload.applicable_categories = transformCategories(
          req.body.applicable_categories,
          req.body.applicable_subcategories
        );
      }
      
      if (req.body.excluded_categories) {
        updatePayload.excluded_categories = transformCategories(
          req.body.excluded_categories,
          req.body.excluded_subcategories
        );
      }

      // Remove old subcategory fields to prevent confusion
      delete updatePayload.applicable_subcategories;
      delete updatePayload.excluded_subcategories;

      if (req.body.bogo_config) {
        updatePayload.bogo_config = {
          ...req.body.bogo_config,
          buy_subcategories: req.body.bogo_config.buy_subcategories || [],
          get_subcategories: req.body.bogo_config.get_subcategories || [],
        };
      }

      const coupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        updatePayload,
        { new: true }
      );

      if (!coupon) {
        return res.status(404).json({ success: false, error: "Coupon not found" });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      console.error("Update coupon error", error);
      res.status(500).json({ success: false, error: "Failed to update coupon" });
    }
  }
);

// DELETE /api/coupons (bulk delete)
router.delete(
  "/",
  async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: "No coupon IDs provided" 
        });
      }

      const result = await Coupon.deleteMany({ _id: { $in: ids } });
      
      res.json({ 
        success: true, 
        message: `${result.deletedCount} coupons deleted successfully`,
        deletedCount: result.deletedCount 
      });
    } catch (error) {
      console.error("Bulk delete coupons error", error);
      res.status(500).json({ success: false, error: "Failed to delete coupons" });
    }
  }
);

// DELETE /api/coupons/:id
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid coupon id")],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const coupon = await Coupon.findByIdAndDelete(req.params.id);
      if (!coupon) {
        return res.status(404).json({ success: false, error: "Coupon not found" });
      }

      res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
      console.error("Delete coupon error", error);
      res.status(500).json({ success: false, error: "Failed to delete coupon" });
    }
  }
);

// POST /api/coupons/apply
router.post(
  "/apply",
  [
    body("code").trim().notEmpty().withMessage("Coupon code is required"),
    body("userId").trim().notEmpty().withMessage("User id is required"),
    body("cart.items").isArray({ min: 1 }).withMessage("Cart items required"),
    body("cart.total")
      .isFloat({ gt: 0 })
      .withMessage("Cart total must be greater than 0"),
  ],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const { code, userId, cart, meta = {} } = req.body;
      const coupon = await Coupon.findOne({ code: code.toUpperCase() });

      if (!coupon) {
        return res.status(404).json({ success: false, error: "Coupon not found" });
      }

      await coupon.recordAnalytics("apply_attempt");

      const now = new Date();
      if (!coupon.is_active || !coupon.published) {
        return res.status(400).json({ success: false, error: "Coupon is not active" });
      }

      if (now < coupon.start_date) {
        return res.status(400).json({ success: false, error: "Coupon not started yet" });
      }

      if (now > coupon.end_date) {
        return res.status(400).json({ success: false, error: "Coupon has expired" });
      }

      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({ success: false, error: "Coupon usage limit reached" });
      }

      if (coupon.limit_per_user) {
        const userUsage = coupon.usage_history.filter(
          (usage) => usage.user_id === userId
        ).length;
        if (userUsage >= coupon.limit_per_user) {
          return res.status(400).json({ success: false, error: "Per user limit reached" });
        }
      }

      if (coupon.first_order_only && !meta.isFirstOrder) {
        return res.status(400).json({ success: false, error: "Coupon valid on first order only" });
      }

      if (coupon.new_user_only && !meta.isNewUser) {
        return res.status(400).json({ success: false, error: "Coupon valid for new users only" });
      }

      if (coupon.applicable_users?.length > 0 && !coupon.applicable_users.includes(userId)) {
        return res.status(400).json({ success: false, error: "User not eligible for this coupon" });
      }

      if (coupon.min_purchase && cart.total < coupon.min_purchase) {
        return res.status(400).json({ success: false, error: `Minimum purchase of ₹${coupon.min_purchase} required` });
      }

      const cartProductIds = new Set(cart.items.map((item) => item.productId));
      const cartVariantIds = new Set(cart.items.map((item) => item.variantId).filter(Boolean));
      const cartCategoryIds = new Set(cart.items.map((item) => item.categoryId).filter(Boolean));

      // Check applicable products
      if (coupon.applied_products?.length > 0) {
        const hasApplicableProduct = coupon.applied_products.some((productId) =>
          cartProductIds.has(String(productId))
        );
        if (!hasApplicableProduct) {
          return res.status(400).json({ success: false, error: "Coupon does not apply to any cart products" });
        }
      }

      // Check excluded products
      if (coupon.excluded_products?.length > 0) {
        const hasExcludedProduct = coupon.excluded_products.some((productId) =>
          cartProductIds.has(String(productId))
        );
        if (hasExcludedProduct) {
          return res.status(400).json({ success: false, error: "Coupon cannot be applied to selected products" });
        }
      }

      // Check applicable variants
      if (coupon.applied_variants?.length > 0) {
        const hasApplicableVariant = coupon.applied_variants.some((variantId) =>
          cartVariantIds.has(String(variantId))
        );
        if (!hasApplicableVariant) {
          return res.status(400).json({ success: false, error: "Coupon does not apply to any cart variants" });
        }
        
        // Filter cart items to only those from applicable variants for discount calculation
        cartProductIds = new Set(
          cart.items
            .filter(item => item.variantId && coupon.applied_variants.includes(String(item.variantId)))
            .map(item => item.productId)
        );
      } else if (coupon.applied_products?.length > 0) {
        // Check if any selected products are variant products
        // If variant products are selected but no specific variants, apply to ALL variants of those products
        const Product = require("../models/Product");
        const variantProducts = await Product.find({
          _id: { $in: coupon.applied_products },
          product_structure: 'variant'
        }).select('_id product_variants').lean();
        
        if (variantProducts.length > 0) {
          // Get all variant IDs from the selected variant products
          const allVariantIds = variantProducts.reduce((ids, product) => {
            const variantIds = product.product_variants
              .filter(variant => variant.published)
              .map(variant => variant._id.toString());
            return ids.concat(variantIds);
          }, []);
          
          // Check if cart has any variants from the selected variant products
          const hasCartVariantFromSelectedProducts = cart.items.some(item => 
            item.variantId && allVariantIds.includes(String(item.variantId))
          );
          
          if (hasCartVariantFromSelectedProducts) {
            // Filter cart items to only those variants from selected variant products
            cartProductIds = new Set(
              cart.items
                .filter(item => item.variantId && allVariantIds.includes(String(item.variantId)))
                .map(item => item.productId)
            );
          }
        }
      }

      // Check excluded variants
      if (coupon.excluded_variants?.length > 0) {
        const hasExcludedVariant = coupon.excluded_variants.some((variantId) =>
          cartVariantIds.has(String(variantId))
        );
        if (hasExcludedVariant) {
          return res.status(400).json({ success: false, error: "Coupon cannot be applied to selected variants" });
        }
        
        // Remove excluded variants from cart product IDs
        const excludedVariantProductIds = cart.items
          .filter(item => item.variantId && coupon.excluded_variants.includes(String(item.variantId)))
          .map(item => item.productId);
        
        excludedVariantProductIds.forEach(productId => {
          cartProductIds.delete(productId);
        });
      }

      // Enhanced category filtering logic
      if (coupon.applicable_categories?.length > 0) {
        // Extract category IDs from the new data structure
        const applicableCategoryIds = coupon.applicable_categories.map(item =>
          typeof item === 'string' ? item : item.categoryId
        );
        
        // Check if cart has any products from applicable categories
        const hasApplicableCategory = cart.items.some((item) => {
          const productCategory = String(item.categoryId);
          return applicableCategoryIds.includes(productCategory);
        });
        
        if (!hasApplicableCategory) {
          return res.status(400).json({ 
            success: false, 
            error: "Coupon does not apply to any products in your cart. This coupon is only valid for specific categories." 
          });
        }
        
        // Filter cart items to only those from applicable categories for discount calculation
        cartProductIds = new Set(
          cart.items
            .filter(item => applicableCategoryIds.includes(String(item.categoryId)))
            .map(item => item.productId)
        );
      }

      if (coupon.excluded_categories?.length > 0) {
        // Extract category IDs from the new data structure
        const excludedCategoryIds = coupon.excluded_categories.map(item => 
          typeof item === 'string' ? item : item.categoryId
        );
        
        // Check if cart contains products from excluded categories
        const hasExcludedCategory = cart.items.some((item) => {
          const productCategory = String(item.categoryId);
          return excludedCategoryIds.includes(productCategory);
        });
        
        if (hasExcludedCategory) {
          return res.status(400).json({ 
            success: false, 
            error: "Coupon cannot be applied to cart with products from excluded categories." 
          });
        }
      }

      // Recalculate cart total based on applicable products if category restrictions exist
      let applicableCartTotal = cart.total;
      if (coupon.applicable_categories?.length > 0) {
        // Extract category IDs from the new data structure
        const applicableCategoryIds = coupon.applicable_categories.map(item => 
          typeof item === 'string' ? item : item.categoryId
        );
        
        applicableCartTotal = cart.items
          .filter(item => applicableCategoryIds.includes(String(item.categoryId)))
          .reduce((total, item) => total + (item.price * item.quantity), 0);
      }

      let discountAmount = 0;
      let details = {};

      switch (coupon.discount_type) {
        case "percentage": {
          discountAmount = (applicableCartTotal * coupon.discount_value) / 100;
          if (coupon.max_discount) {
            discountAmount = Math.min(discountAmount, coupon.max_discount);
          }
          details = {
            type: "percentage",
            rate: coupon.discount_value,
            maxDiscount: coupon.max_discount,
            applicableCartTotal,
          };
          break;
        }

        case "fixed": {
          discountAmount = Math.min(coupon.discount_value, applicableCartTotal);
          details = {
            type: "fixed",
            value: coupon.discount_value,
            applicableCartTotal,
          };
          break;
        }

        case "free_shipping": {
          discountAmount = meta.shippingCost || 0;
          details = {
            type: "free_shipping",
            shippingCost: meta.shippingCost || 0,
            applicableCartTotal,
          };
          break;
        }

        case "cashback": {
          discountAmount = Math.min(coupon.cashback_amount || 0, applicableCartTotal);
          details = {
            type: "cashback",
            cashbackAmount: coupon.cashback_amount,
            applicableCartTotal,
          };
          break;
        }

        case "bogo": {
          const { buy_quantity = 1, get_quantity = 1 } = coupon.bogo_config || {};
          const bogoEligibleItems = cart.items.filter((item) => {
            const productEligible = coupon.bogo_config?.buy_products?.some((id) => String(id) === String(item.productId));
            const categoryEligible = coupon.bogo_config?.buy_categories?.some((id) => String(id) === String(item.categoryId));
            return productEligible || categoryEligible;
          });

          const totalEligibleQuantity = bogoEligibleItems.reduce((sum, item) => sum + item.quantity, 0);
          const freeUnits = Math.floor(totalEligibleQuantity / (buy_quantity + get_quantity)) * get_quantity;
          const sortedEligibleItems = [...bogoEligibleItems].sort((a, b) => a.price - b.price);

          for (let i = 0; i < freeUnits && i < sortedEligibleItems.length; i++) {
            discountAmount += sortedEligibleItems[i].price;
          }

          details = {
            type: "bogo",
            freeUnits,
            buyQuantity: buy_quantity,
            getQuantity: get_quantity,
          };
          break;
        }
      }

      const finalTotal = Math.max(cart.total - discountAmount, 0);

      res.json({
        success: true,
        data: {
          coupon: {
            id: coupon._id,
            code: coupon.code,
            campaign_name: coupon.campaign_name,
            discount_type: coupon.discount_type,
          },
          discountAmount,
          finalTotal,
          details,
        },
      });
    } catch (error) {
      console.error("Apply coupon error", error);
      res.status(500).json({ success: false, error: "Failed to apply coupon" });
    }
  }
);

// PATCH /api/coupons/:id/status
router.patch(
  "/:id/status",
  [
    param("id").isMongoId().withMessage("Invalid coupon id"),
    body("is_active").isBoolean().withMessage("is_active boolean required"),
    body("published").optional().isBoolean(),
  ],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const coupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        {
          is_active: req.body.is_active,
          ...(typeof req.body.published !== "undefined" && {
            published: req.body.published,
          }),
          updated_at: new Date(),
        },
        { new: true }
      );

      if (!coupon) {
        return res.status(404).json({ success: false, error: "Coupon not found" });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      console.error("Toggle coupon status error", error);
      res.status(500).json({ success: false, error: "Failed to update coupon status" });
    }
  }
);

// GET /api/coupons/:id/analytics
router.get(
  "/:id/analytics",
  [param("id").isMongoId().withMessage("Invalid coupon id")],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const coupon = await Coupon.findById(req.params.id).lean();
      if (!coupon) {
        return res.status(404).json({ success: false, error: "Coupon not found" });
      }

      const revenueImpact = coupon.analytics.total_revenue_impact;
      const totalDiscount = coupon.analytics.total_discount_given;
      const conversionRate = coupon.analytics.conversion_rate;

      res.json({
        success: true,
        data: {
          couponId: coupon._id,
          code: coupon.code,
          analytics: {
            views: coupon.analytics.views,
            clicks: coupon.analytics.clicks,
            applyAttempts: coupon.analytics.apply_attempts,
            applySuccess: coupon.analytics.apply_success,
            conversionRate,
            revenueImpact,
            totalDiscount,
            lastUpdated: coupon.analytics.last_updated,
          },
        },
      });
    } catch (error) {
      console.error("Get coupon analytics error", error);
      res.status(500).json({ success: false, error: "Failed to load analytics" });
    }
  }
);

// Export coupons to CSV
router.get("/export/csv", async (req, res) => {
  try {
    const query = buildFilterQuery(req.query);
    const coupons = await Coupon.find(query).sort({ created_at: -1 }).lean();

    if (coupons.length === 0) {
      return res.status(404).json({ success: false, error: "No coupons found to export" });
    }

    const csvHeaders = [
      "Code",
      "Campaign Name",
      "Description",
      "Discount Type",
      "Discount Value",
      "Cashback Amount",
      "Min Purchase",
      "Max Discount",
      "Usage Limit",
      "Used Count",
      "Limit Per User",
      "Start Date",
      "End Date",
      "Is Active",
      "Published",
      "Auto Apply",
      "Priority",
      "Created At",
      "Updated At",
    ];

    const csvRows = coupons.map((coupon) => [
      coupon.code,
      coupon.campaign_name,
      coupon.description || "",
      coupon.discount_type,
      coupon.discount_value,
      coupon.cashback_amount || "",
      coupon.min_purchase || 0,
      coupon.max_discount || "",
      coupon.usage_limit || "",
      coupon.used_count || 0,
      coupon.limit_per_user || "",
      coupon.start_date?.toISOString() ?? "",
      coupon.end_date?.toISOString() ?? "",
      coupon.is_active ? "Yes" : "No",
      coupon.published ? "Yes" : "No",
      coupon.auto_apply ? "Yes" : "No",
      coupon.priority,
      coupon.created_at?.toISOString() ?? "",
      coupon.updated_at?.toISOString() ?? "",
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((field) => `"${field}`.replace(/"/g, '""') + '"').join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="coupons_${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Export CSV error", error);
    res.status(500).json({ success: false, error: "Failed to export coupons" });
  }
});

// Export coupons to JSON
router.get("/export/json", async (req, res) => {
  try {
    const query = buildFilterQuery(req.query);
    const coupons = await Coupon.find(query).sort({ created_at: -1 }).lean();

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="coupons_${new Date().toISOString().split("T")[0]}.json"`
    );

    res.json({
      exportedAt: new Date().toISOString(),
      totalRecords: coupons.length,
      data: coupons,
    });
  } catch (error) {
    console.error("Export JSON error", error);
    res.status(500).json({ success: false, error: "Failed to export coupons" });
  }
});

module.exports = router;
