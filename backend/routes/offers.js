const express = require("express");
const { body, validationResult, param, query } = require("express-validator");
const { ObjectId } = require("mongodb");
const Offer = require("../models/Offer");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");

const router = express.Router();

// Helper function to build filter query for offers
const buildFilterQuery = (filters) => {
  const {
    search,
    offerType,
    status,
    published,
    startDate,
    endDate,
    priority,
    usageThreshold,
    createdBy
  } = filters;

  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  if (offerType) {
    query.offer_type = offerType;
  }

  if (status) {
    query.status = status;
  }

  if (typeof published !== "undefined") {
    query.published = published === "true";
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

  if (priority) {
    if (priority === "high") {
      query.priority = { $gte: 80 };
    } else if (priority === "medium") {
      query.priority = { $gte: 40, $lt: 80 };
    } else if (priority === "low") {
      query.priority = { $lt: 40 };
    }
  }

  if (usageThreshold) {
    if (usageThreshold === "exhausted") {
      query.$expr = { $gte: [{ $multiply: ["$used_count", 100] }, "$usage_limit"] };
    } else if (usageThreshold === "near_limit") {
      query.$expr = { 
        $and: [
          { $gte: [{ $multiply: ["$used_count", 100] }, { $multiply: ["$usage_limit", 80] }] },
          { $lt: [{ $multiply: ["$used_count", 100] }, "$usage_limit"] }
        ]
      };
    } else if (usageThreshold === "low_usage") {
      query.$expr = { $lt: [{ $multiply: ["$used_count", 100] }, { $multiply: ["$usage_limit", 30] }] };
    }
  }

  if (createdBy) {
    query.created_by = createdBy;
  }

  return query;
};

const normalizeScope = (value, allowed, fallback) => {
  const normalized = typeof value === "string" ? value.toLowerCase().trim() : "";
  return allowed.includes(normalized) ? normalized : fallback;
};

const normalizeDiscountType = (value) => {
  const normalized = typeof value === "string" ? value.toUpperCase().trim() : "";
  return ["FREE", "PERCENT"].includes(normalized) ? normalized : null;
};

const toStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((id) => (id != null ? id.toString() : null))
    .filter((id) => !!id);
};

async function validateBOGOConfig(config) {
  if (!config) {
    return "BOGO configuration is required for BOGO offers";
  }

  const buy = config.buy || {};
  const get = config.get || {};

  const buyScope = normalizeScope(buy.scope, ["product", "category"], "");
  if (!buyScope) {
    return "Buy scope must be either product or category";
  }

  const buyQuantity = Number(buy.quantity);
  if (!Number.isFinite(buyQuantity) || buyQuantity < 1) {
    return "Buy quantity must be at least 1";
  }

  if (buyScope === "product") {
    const productIds = toStringArray(buy.product_ids);
    if (productIds.length === 0) {
      return "Provide at least one product for the buy rule";
    }

    const products = await Product.find({ _id: { $in: productIds } }, { _id: 1 }).lean();
    if (products.length !== productIds.length) {
      return "Some buy products in the BOGO configuration are invalid";
    }
  } else {
    const categoryIds = toStringArray(buy.category_ids);
    if (categoryIds.length === 0) {
      return "Provide at least one category for the buy rule";
    }

    const categories = await Category.find({ _id: { $in: categoryIds } }, { _id: 1 }).lean();
    if (categories.length !== categoryIds.length) {
      return "Some buy categories in the BOGO configuration are invalid";
    }
  }

  const getScope = normalizeScope(get.scope, ["same", "product", "category"], "");
  if (!getScope) {
    return "Get scope must be one of same, product, or category";
  }

  const getQuantity = Number(get.quantity);
  if (!Number.isFinite(getQuantity) || getQuantity < 1) {
    return "Get quantity must be at least 1";
  }

  const discountType = normalizeDiscountType(get.discount_type);
  if (!discountType) {
    return "Discount type must be FREE or PERCENT";
  }

  if (discountType === "PERCENT") {
    const discountValue = Number(get.discount_value);
    if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100) {
      return "Percent discount value must be between 0 and 100";
    }
  }

  if (getScope === "product") {
    const productIds = toStringArray(get.product_ids);
    if (productIds.length === 0) {
      return "Provide at least one product for the get rule";
    }

    const products = await Product.find({ _id: { $in: productIds } }, { _id: 1 }).lean();
    if (products.length !== productIds.length) {
      return "Some get products in the BOGO configuration are invalid";
    }
  }

  if (getScope === "category") {
    const categoryIds = toStringArray(get.category_ids);
    if (categoryIds.length === 0) {
      return "Provide at least one category for the get rule";
    }

    const categories = await Category.find({ _id: { $in: categoryIds } }, { _id: 1 }).lean();
    if (categories.length !== categoryIds.length) {
      return "Some get categories in the BOGO configuration are invalid";
    }
  }

  if (config.apply_to) {
    const applyTo = normalizeScope(config.apply_to, ["cheapest", "first_matched"], "");
    if (!applyTo) {
      return "Apply-to strategy must be cheapest or first_matched";
    }
  }

  if (config.max_free_quantity !== undefined && config.max_free_quantity !== null && config.max_free_quantity !== "") {
    const maxFree = Number(config.max_free_quantity);
    if (!Number.isFinite(maxFree) || maxFree < 0) {
      return "Max free quantity must be zero or a positive number";
    }
  }

  return null;
}

function sanitizeBOGOConfig(config) {
  const buy = config?.buy || {};
  const get = config?.get || {};

  const buyScope = normalizeScope(buy.scope, ["product", "category"], "product");
  const getScope = normalizeScope(get.scope, ["same", "product", "category"], "same");
  const discountType = normalizeDiscountType(get.discount_type) || "FREE";
  const applyTo = normalizeScope(config?.apply_to, ["cheapest", "first_matched"], "cheapest");

  const sanitized = {
    buy: {
      scope: buyScope,
      product_ids: buyScope === "product" ? toStringArray(buy.product_ids) : [],
      category_ids: buyScope === "category" ? toStringArray(buy.category_ids) : [],
      quantity: Number(buy.quantity)
    },
    get: {
      scope: getScope,
      product_ids: getScope === "product" ? toStringArray(get.product_ids) : [],
      category_ids: getScope === "category" ? toStringArray(get.category_ids) : [],
      quantity: Number(get.quantity),
      discount_type: discountType,
      discount_value: discountType === "FREE" ? 100 : Number(get.discount_value)
    },
    apply_to: applyTo,
  };

  if (getScope === "same") {
    sanitized.get.product_ids = [];
    sanitized.get.category_ids = [];
  }

  if (config?.max_free_quantity !== undefined && config?.max_free_quantity !== null && config?.max_free_quantity !== "") {
    const maxFree = Number(config.max_free_quantity);
    if (!Number.isNaN(maxFree)) {
      sanitized.max_free_quantity = maxFree;
    }
  }

  return sanitized;
}

// Validation rules for offer creation/update
const validationRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Offer title is required")
    .isLength({ max: 200 })
    .withMessage("Title must be less than 200 characters"),
  
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be less than 2000 characters"),
  
  body("offer_type")
    .optional()
    .isIn(["bogo", "flash", "category_discount", "storewide"])
    .withMessage("Invalid offer type"),
  
  body("priority")
    .optional()
    .isInt({ min: 0, max: 999 })
    .withMessage("Priority must be between 0 and 999"),
  
  body("status")
    .optional()
    .isIn(["draft", "active", "disabled"])
    .withMessage("Invalid status"),
  
  body("start_date")
    .optional()
    .custom((value, { req }) => {
      // Skip validation if value is empty, null, or undefined
      if (!value || value === "") {
        return true;
      }
      // Validate if it's a valid date
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error("Start date must be a valid date");
      }
      return true;
    }),
  
  body("end_date")
    .optional()
    .custom((value, { req }) => {
      // Skip validation if value is empty, null, or undefined
      if (!value || value === "") {
        return true;
      }
      // Validate if it's a valid date
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error("End date must be a valid date");
      }
      return true;
    })
    .custom((value, { req }) => {
      // Only validate date range if both dates are provided and valid
      if (value && value !== "" && req.body.start_date && req.body.start_date !== "") {
        const endDate = new Date(value);
        const startDate = new Date(req.body.start_date);
        if (endDate <= startDate) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),
  
  body("usage_limit")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Usage limit must be a positive integer"),
  
  body("limit_per_user")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Limit per user must be a positive integer"),
  
  body("allow_guest_users")
    .optional()
    .isBoolean()
    .withMessage("Allow guest users must be a boolean"),
  
  // BOGO specific validation (only if offer_type is bogo and values are provided)
  body("bogo_config.buy.quantity")
    .if((value, { req }) => req.body.offer_type === "bogo")
    .isInt({ min: 1 })
    .withMessage("Buy quantity must be at least 1"),
  
  body("bogo_config.get.quantity")
    .if((value, { req }) => req.body.offer_type === "bogo")
    .isInt({ min: 1 })
    .withMessage("Get quantity must be at least 1"),
  
  // Flash sale specific validation (only if offer_type is flash and values are provided)
  body("flash_config.discount_type")
    .if((value, { req }) => req.body.offer_type === "flash" && value !== undefined && value !== null)
    .isIn(["percentage", "fixed"])
    .withMessage("Invalid discount type for flash sale"),
  
  body("flash_config.discount_value")
    .if((value, { req }) => req.body.offer_type === "flash" && value !== undefined && value !== null && value > 0)
    .isFloat({ gt: 0 })
    .withMessage("Discount value must be greater than 0"),
  
  // Category discount specific validation (only if offer_type is category_discount and values are provided)
  body("category_config.discount_type")
    .if((value, { req }) => req.body.offer_type === "category_discount" && value !== undefined && value !== null)
    .isIn(["percentage", "fixed"])
    .withMessage("Invalid discount type for category discount"),
  
  body("category_config.discount_value")
    .if((value, { req }) => req.body.offer_type === "category_discount" && value !== undefined && value !== null && value > 0)
    .isFloat({ gt: 0 })
    .withMessage("Discount value must be greater than 0"),
  
  // Store-wide specific validation (only if offer_type is storewide and values are provided)
  body("storewide_config.discount_type")
    .if((value, { req }) => req.body.offer_type === "storewide" && value !== undefined && value !== null)
    .isIn(["percentage", "fixed"])
    .withMessage("Invalid discount type for store-wide discount"),
  
  body("storewide_config.discount_value")
    .if((value, { req }) => req.body.offer_type === "storewide" && value !== undefined && value !== null && value > 0)
    .isFloat({ gt: 0 })
    .withMessage("Discount value must be greater than 0"),
];

// Handle validation errors
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

// ==================== ADMIN API ENDPOINTS ====================

// GET /api/offers - List offers with filters and pagination
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("published").optional().isBoolean(),
    query("sort").optional().isIn(["priority", "start_date", "end_date", "used_count", "created_at"]),
    query("order").optional().isIn(["asc", "desc"]),
  ],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const {
        page = 1,
        limit = 10,
        sort = "priority",
        order = "desc",
        search,
        ...filters
      } = req.query;

      const query = buildFilterQuery({ search, ...filters });

      const [data, count] = await Promise.all([
        Offer.find(query)
          .sort({ [sort]: order === "desc" ? -1 : 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Offer.countDocuments(query),
      ]);

      res.json({
        success: true,
        data,
        meta: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("List offers error", error);
      res.status(500).json({ success: false, error: "Failed to fetch offers" });
    }
  }
);

// GET /api/offers/:id - Get single offer
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid offer id")],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const offer = await Offer.findById(req.params.id)
        .populate([
          'bogo_config.buy.product_ids',
          'bogo_config.get.product_ids',
          'flash_config.applicable_products',
          'category_config.target_categories',
          'included_products',
          'excluded_products'
        ])
        .lean();

      if (!offer) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }

      res.json({ success: true, data: offer });
    } catch (error) {
      console.error("Get offer error", error);
      res.status(500).json({ success: false, error: "Failed to fetch offer" });
    }
  }
);

// POST /api/offers - Create new offer
router.post("/", validationRules, async (req, res) => {
  try {
    console.log("Backend - Received offer data:", req.body);
    const validationError = handleValidationErrors(req, res);
    if (validationError) return validationError;

    // Check for duplicate slug
    if (req.body.slug) {
      const existingSlug = await Offer.findOne({ slug: req.body.slug });
      if (existingSlug) {
        return res.status(400).json({
          success: false,
          error: "Offer slug must be unique",
        });
      }
    }

    // Validate offer type specific configurations (only if meaningful values are provided)
    const { offer_type, bogo_config, flash_config, category_config, storewide_config } = req.body;

    if (offer_type === "bogo") {
      const validationError = await validateBOGOConfig(bogo_config);
      if (validationError) {
        return res.status(400).json({ success: false, error: validationError });
      }
    }

    if (offer_type === "flash" && flash_config && flash_config.discount_type && flash_config.discount_value > 0) {
      // Only validate flash if meaningful values are provided
      if (!flash_config.discount_type || !flash_config.discount_value) {
        return res.status(400).json({
          success: false,
          error: "Flash sale configuration is required for flash offers",
        });
      }
    }

    if (offer_type === "category_discount" && category_config && category_config.discount_type && category_config.discount_value > 0) {
      // Only validate category discount if meaningful values are provided
      if (!category_config.discount_type || !category_config.discount_value || !category_config.target_categories?.length) {
        return res.status(400).json({
          success: false,
          error: "Category discount configuration is required for category discount offers",
        });
      }
    }

    if (offer_type === "storewide" && storewide_config && storewide_config.discount_type && storewide_config.discount_value > 0) {
      // Only validate storewide if meaningful values are provided
      if (!storewide_config.discount_type || !storewide_config.discount_value) {
        return res.status(400).json({
          success: false,
          error: "Store-wide configuration is required for store-wide offers",
        });
      }
    }

    // Validate referenced products and categories exist
    if (category_config?.target_categories?.length) {
      const validCategories = await Category.find({ _id: { $in: category_config.target_categories } });
      if (validCategories.length !== category_config.target_categories.length) {
        return res.status(400).json({
          success: false,
          error: "Some target categories are invalid",
        });
      }
    }

    const { start_date, end_date, bogo_config: rawBogoConfig, flash_config: rawFlashConfig, category_config: rawCategoryConfig, storewide_config: rawStorewideConfig, ...otherFields } = req.body;
    
    // Only include the relevant configuration based on offer type
    let configData = {};
    if (offer_type === "bogo") {
      configData.bogo_config = sanitizeBOGOConfig(rawBogoConfig);
    } else if (offer_type === "flash") {
      configData.flash_config = rawFlashConfig;
    } else if (offer_type === "category_discount") {
      configData.category_config = rawCategoryConfig;
    } else if (offer_type === "storewide") {
      configData.storewide_config = rawStorewideConfig;
    }
    
    const offerData = {
      ...otherFields,
      ...configData,
      // Only include dates if they're valid
      ...(start_date && start_date !== "" && { start_date: new Date(start_date) }),
      ...(end_date && end_date !== "" && { end_date: new Date(end_date) }),
      usage_tracking: {
        user_usage: [],
        ip_usage: []
      },
      analytics: {
        views: 0,
        cart_attempts: 0,
        applied_success: 0,
        total_discount_given: 0,
        total_revenue_impact: 0,
        conversion_rate: 0,
        last_updated: new Date(),
        daily_stats: [],
        hourly_stats: [],
        product_impact: []
      }
    };

    const offer = await Offer.create(offerData);

    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    console.error("Create offer error", error);
    res.status(500).json({ success: false, error: "Failed to create offer" });
  }
});

// PUT /api/offers/:id - Update offer
router.put(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid offer id"), ...validationRules],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const offer = await Offer.findById(req.params.id);
      if (!offer) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }

      // Validate offer type specific configurations
      const { offer_type, bogo_config, flash_config, category_config, storewide_config } = req.body;

      if (offer_type === "bogo") {
        const validationError = await validateBOGOConfig(bogo_config);
        if (validationError) {
          return res.status(400).json({ success: false, error: validationError });
        }
      }

      if (offer_type === "flash" && (!flash_config || !flash_config.discount_type || !flash_config.discount_value)) {
        return res.status(400).json({
          success: false,
          error: "Flash sale configuration is required for flash offers",
        });
      }

      if (offer_type === "category_discount" && (!category_config || !category_config.discount_type || !category_config.discount_value || !category_config.target_categories?.length)) {
        return res.status(400).json({
          success: false,
          error: "Category discount configuration is required for category discount offers",
        });
      }

      if (offer_type === "storewide" && (!storewide_config || !storewide_config.discount_type || !storewide_config.discount_value)) {
        return res.status(400).json({
          success: false,
          error: "Store-wide configuration is required for store-wide offers",
        });
      }

      const { start_date: updateStart, end_date: updateEnd, bogo_config: updateRawBogoConfig, flash_config: updateRawFlashConfig, category_config: updateRawCategoryConfig, storewide_config: updateRawStorewideConfig, ...restUpdateFields } = req.body;

      // Only include the relevant configuration based on offer type
      let configData = {};
      if (offer_type === "bogo") {
        configData.bogo_config = sanitizeBOGOConfig(updateRawBogoConfig);
      } else if (offer_type === "flash") {
        configData.flash_config = updateRawFlashConfig;
      } else if (offer_type === "category_discount") {
        configData.category_config = updateRawCategoryConfig;
      } else if (offer_type === "storewide") {
        configData.storewide_config = updateRawStorewideConfig;
      }

    const updatePayload = {
      ...restUpdateFields,
      ...configData,
      last_updated_by: req.user?.id || "system",
      updated_at: new Date(),
      ...(updateStart && updateStart !== "" ? { start_date: new Date(updateStart) } : {}),
      ...(updateEnd && updateEnd !== "" ? { end_date: new Date(updateEnd) } : {})
    };

      const updatedOffer = await Offer.findByIdAndUpdate(
        req.params.id,
        updatePayload,
        { new: true }
      );

      res.json({ success: true, data: updatedOffer });
    } catch (error) {
      console.error("Update offer error", error);
      res.status(500).json({ success: false, error: "Failed to update offer" });
    }
  }
);

// DELETE /api/offers/:id - Delete offer
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid offer id")],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const offer = await Offer.findByIdAndDelete(req.params.id);
      if (!offer) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }

      res.json({ success: true, message: "Offer deleted successfully" });
    } catch (error) {
      console.error("Delete offer error", error);
      res.status(500).json({ success: false, error: "Failed to delete offer" });
    }
  }
);

// PUT /api/offers/bulk - Bulk update offers
router.put("/bulk", async (req, res) => {
  try {
    const { ids, action, data } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "No offer IDs provided" 
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

    let updateData = {};
    let message = "";

    switch (action) {
      case "activate":
        updateData = { 
          status: "active", 
          published: true, 
          is_active: true,
          updated_at: new Date()
        };
        message = "Offers activated successfully";
        break;
      case "deactivate":
        updateData = { 
          status: "disabled", 
          published: false, 
          is_active: false,
          updated_at: new Date()
        };
        message = "Offers deactivated successfully";
        break;
      case "delete":
        const result = await Offer.deleteMany({ _id: { $in: objectIds } });
        return res.json({ 
          success: true, 
          message: `${result.deletedCount} offers deleted successfully`,
          deletedCount: result.deletedCount 
        });
      case "priority":
        if (!data || typeof data.priority !== "number") {
          return res.status(400).json({ 
            success: false, 
            error: "Priority value is required" 
          });
        }
        updateData = { 
          priority: data.priority,
          updated_at: new Date()
        };
        message = `Offers priority updated to ${data.priority}`;
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: "Invalid bulk action" 
        });
    }

    const result = await Offer.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );

    res.json({ 
      success: true, 
      message,
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error("Bulk update offers error", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update offers" 
    });
  }
});

// POST /api/offers/:id/toggle-status - Toggle offer status
router.post(
  "/:id/toggle-status",
  [param("id").isMongoId().withMessage("Invalid offer id")],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const offer = await Offer.findById(req.params.id);
      if (!offer) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }

      const newStatus = offer.status === "active" ? "disabled" : "active";
      const newPublished = newStatus === "active";
      const newIsActive = newStatus === "active";

      const updatedOffer = await Offer.findByIdAndUpdate(
        req.params.id,
        {
          status: newStatus,
          published: newPublished,
          is_active: newIsActive,
          updated_at: new Date(),
          last_updated_by: req.user?.id || "system"
        },
        { new: true }
      );

      res.json({ 
        success: true, 
        data: updatedOffer,
        message: `Offer ${newStatus === "active" ? "activated" : "deactivated"} successfully`
      });
    } catch (error) {
      console.error("Toggle offer status error", error);
      res.status(500).json({ success: false, error: "Failed to toggle offer status" });
    }
  }
);

// ==================== USER API ENDPOINTS ====================

// GET /api/offers/active - Get all active offers
router.get("/active", async (req, res) => {
  try {
    const offers = await Offer.findActiveOffers()
      .populate([
        'bogo_config.buy_products',
        'bogo_config.get_products',
        'flash_config.applicable_products',
        'category_config.target_categories',
        'included_products',
        'excluded_products'
      ])
      .lean();

    res.json({ success: true, data: offers });
  } catch (error) {
    console.error("Get active offers error", error);
    res.status(500).json({ success: false, error: "Failed to fetch active offers" });
  }
});

// GET /api/offers/:slug - Get offer by slug
router.get(
  "/slug/:slug",
  [param("slug").isSlug().withMessage("Invalid slug format")],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const offer = await Offer.findBySlug(req.params.slug);
      if (!offer) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }

      // Record view for analytics
      await Offer.findByIdAndUpdate(offer._id, {
        $inc: { "analytics.views": 1 },
        $set: { "analytics.last_updated": new Date() }
      });

      res.json({ success: true, data: offer });
    } catch (error) {
      console.error("Get offer by slug error", error);
      res.status(500).json({ success: false, error: "Failed to fetch offer" });
    }
  }
);

// ==================== CART OFFER APPLICATION ====================

// POST /api/cart/apply-offers - Apply offers to cart
router.post("/apply-offers", async (req, res) => {
  try {
    const { cart, userId, ipAddress } = req.body;

    if (!cart || !cart.items || !Array.isArray(cart.items)) {
      return res.status(400).json({
        success: false,
        error: "Invalid cart data"
      });
    }

    // Get all active offers sorted by priority (highest first)
    const activeOffers = await Offer.findActiveOffers()
      .populate([
        'bogo_config.buy.product_ids',
        'bogo_config.get.product_ids',
        'flash_config.applicable_products',
        'category_config.target_categories',
        'included_products',
        'excluded_products'
      ])
      .lean();

    const appliedOffers = [];
    let totalDiscount = 0;
    const appliedOfferIds = new Set();

    // Process offers by priority, handling stacking logic
    for (const offer of activeOffers) {
      try {
        // Skip if this offer is excluded by any previously applied non-stackable offer
        if (appliedOfferIds.has(offer._id.toString())) continue;
        
        // Check if this offer is excluded by any applied offer
        const isExcluded = appliedOffers.some(appliedOffer => 
          appliedOffer.excluded_offer_ids?.includes(offer._id)
        );
        if (isExcluded) continue;

        const result = await processOffer(offer, cart, userId, ipAddress);
        if (result.success) {
          // Check stacking rules
          const lastAppliedOffer = appliedOffers[appliedOffers.length - 1];
          
          // If last applied offer is non-stackable, only allow stackable offers
          if (lastAppliedOffer && !lastAppliedOffer.is_stackable && !offer.is_stackable) {
            continue;
          }

          appliedOffers.push({
            ...result.offerApplication,
            is_stackable: offer.is_stackable,
            excluded_offer_ids: offer.excluded_offer_ids
          });
          appliedOfferIds.add(offer._id.toString());
          totalDiscount += result.discountAmount;
          
          // Update offer analytics
          await Offer.findByIdAndUpdate(offer._id, {
            $inc: { 
              "analytics.applied_success": 1,
              "analytics.total_discount_given": result.discountAmount
            },
            $set: { "analytics.last_updated": new Date() }
          });
        }
      } catch (error) {
        console.error(`Error processing offer ${offer._id}:`, error);
        // Continue with other offers
      }
    }

    res.json({
      success: true,
      data: {
        appliedOffers,
        totalDiscount,
        originalTotal: cart.total,
        discountedTotal: cart.total - totalDiscount
      }
    });
  } catch (error) {
    console.error("Apply offers error", error);
    res.status(500).json({ success: false, error: "Failed to apply offers" });
  }
});

// POST /api/cart/revalidate-offers - Revalidate offers in cart
router.post("/revalidate-offers", async (req, res) => {
  try {
    const { cart, userId, ipAddress, currentOffers } = req.body;

    if (!cart || !cart.items || !Array.isArray(cart.items)) {
      return res.status(400).json({
        success: false,
        error: "Invalid cart data"
      });
    }

    const activeOffers = await Offer.findActiveOffers()
      .populate([
        'bogo_config.buy.product_ids',
        'bogo_config.get.product_ids',
        'flash_config.applicable_products',
        'category_config.target_categories',
        'included_products',
        'excluded_products',
        'excluded_categories'
      ])
      .lean();

    const validOffers = [];
    const invalidOffers = [];

    // Check each current offer
    for (const currentOffer of currentOffers || []) {
      const offer = activeOffers.find(o => o._id.toString() === currentOffer.offerId);
      
      if (!offer) {
        invalidOffers.push({
          offerId: currentOffer.offerId,
          reason: "Offer no longer active"
        });
        continue;
      }

      try {
        const result = await processOffer(offer, cart, userId, ipAddress);
        if (result.success) {
          validOffers.push(result.offerApplication);
        } else {
          invalidOffers.push({
            offerId: currentOffer.offerId,
            reason: result.reason
          });
        }
      } catch (error) {
        invalidOffers.push({
          offerId: currentOffer.offerId,
          reason: "Processing error"
        });
      }
    }

    res.json({
      success: true,
      data: {
        validOffers,
        invalidOffers
      }
    });
  } catch (error) {
    console.error("Revalidate offers error", error);
    res.status(500).json({ success: false, error: "Failed to revalidate offers" });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// GET /api/offers/:id/analytics - Get offer analytics
router.get(
  "/:id/analytics",
  [param("id").isMongoId().withMessage("Invalid offer id")],
  async (req, res) => {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const { startDate, endDate, granularity = "daily" } = req.query;

      const offer = await Offer.findById(req.params.id);
      if (!offer) {
        return res.status(404).json({ success: false, error: "Offer not found" });
      }

      let analytics = offer.analytics;

      // Filter by date range if provided
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        if (granularity === "daily") {
          analytics.daily_stats = analytics.daily_stats.filter(stat => {
            const statDate = new Date(stat.date);
            if (startDate && statDate < new Date(startDate)) return false;
            if (endDate && statDate > new Date(endDate)) return false;
            return true;
          });
        } else if (granularity === "hourly") {
          analytics.hourly_stats = analytics.hourly_stats.filter(stat => {
            const statDate = new Date(stat.date);
            if (startDate && statDate < new Date(startDate)) return false;
            if (endDate && statDate > new Date(endDate)) return false;
            return true;
          });
        }
      }

      res.json({ success: true, data: analytics });
    } catch (error) {
      console.error("Get offer analytics error", error);
      res.status(500).json({ success: false, error: "Failed to fetch offer analytics" });
    }
  }
);

// GET /api/offers/export/csv - Export offers to CSV
router.get("/export/csv", async (req, res) => {
  try {
    const query = buildFilterQuery(req.query);
    const offers = await Offer.find(query).sort({ created_at: -1 }).lean();

    const csvHeaders = [
      "ID",
      "Title",
      "Slug",
      "Type",
      "Status",
      "Priority",
      "Start Date",
      "End Date",
      "Usage Limit",
      "Used Count",
      "Limit Per User",
      "Views",
      "Cart Attempts",
      "Applied Success",
      "Total Discount Given",
      "Created At",
      "Updated At"
    ];

    const csvRows = offers.map((offer) => [
      offer._id,
      offer.title,
      offer.slug,
      offer.offer_type,
      offer.status,
      offer.priority,
      offer.start_date?.toISOString() ?? "",
      offer.end_date?.toISOString() ?? "",
      offer.usage_limit || "",
      offer.used_count,
      offer.limit_per_user || "",
      offer.analytics?.views || 0,
      offer.analytics?.cart_attempts || 0,
      offer.analytics?.applied_success || 0,
      offer.analytics?.total_discount_given || 0,
      offer.created_at?.toISOString() ?? "",
      offer.updated_at?.toISOString() ?? ""
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="offers_${new Date().toISOString().split("T")[0]}.csv"`
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Export CSV error", error);
    res.status(500).json({ success: false, error: "Failed to export offers" });
  }
});

// ==================== HELPER FUNCTIONS ====================

// Process offer application logic
async function processOffer(offer, cart, userId, ipAddress) {
  // Check if user is eligible
  if (userId && !offer.isEligibleUser(userId)) {
    return { success: false, reason: "User not eligible" };
  }

  // Strict usage limit validation - reject if used_count >= usage_limit
  if (offer.usage_limit && offer.used_count >= offer.usage_limit) {
    return { success: false, reason: "Offer usage limit exceeded" };
  }

  // Strict per-user limit validation - reject if user exceeds limit_per_user
  if (userId && offer.limit_per_user) {
    const userUsage = offer.usage_tracking?.user_usage?.find(
      usage => usage.user_id === userId
    );
    if (userUsage && userUsage.usage_count >= offer.limit_per_user) {
      return { success: false, reason: "Per-user usage limit exceeded" };
    }
  }

  // Check guest user restriction - never rely on IP alone
  if (!userId && !offer.allow_guest_users) {
    return { success: false, reason: "Guest users not allowed for this offer" };
  }

  // For guest users, enforce basic usage tracking without IP reliance
  if (!userId) {
    // Guests can only use offers if explicitly allowed and no per-user limits
    if (offer.limit_per_user) {
      return { success: false, reason: "Guest users cannot use offers with per-user limits" };
    }
  }

  // Validate offer type isolation - only process the active config
  const activeConfig = getActiveConfig(offer);
  if (!activeConfig) {
    return { success: false, reason: "No valid configuration found for offer type" };
  }

  // Process based on offer type
  let discountAmount = 0;
  let offerApplication = null;

  switch (offer.offer_type) {
    case "bogo":
      const bogoResult = await processBOGO(offer, cart);
      if (bogoResult.success) {
        discountAmount = bogoResult.discountAmount;
        offerApplication = bogoResult.application;
      }
      break;
    case "flash":
      const flashResult = await processFlashSale(offer, cart);
      if (flashResult.success) {
        discountAmount = flashResult.discountAmount;
        offerApplication = flashResult.application;
      }
      break;
    case "category_discount":
      const categoryResult = await processCategoryDiscount(offer, cart);
      if (categoryResult.success) {
        discountAmount = categoryResult.discountAmount;
        offerApplication = categoryResult.application;
      }
      break;
    case "storewide":
      const storewideResult = await processStorewideDiscount(offer, cart);
      if (storewideResult.success) {
        discountAmount = storewideResult.discountAmount;
        offerApplication = storewideResult.application;
      }
      break;
  }

  if (discountAmount > 0) {
    // Atomic usage recording with strict validation
    const updateData = {
      $inc: { used_count: 1 }
    };

    // Only track user usage for authenticated users
    if (userId) {
      updateData.$push = {
        "usage_tracking.user_usage": {
          user_id: userId,
          usage_count: 1,
          last_used: new Date(),
          total_discount_received: discountAmount
        }
      };
    }

    // Update offer usage atomically
    await Offer.findByIdAndUpdate(offer._id, updateData);

    return {
      success: true,
      discountAmount,
      offerApplication
    };
  }

  return { success: false, reason: "No discount applicable" };
}

// BOGO Processing
async function processBOGO(offer, cart) {
  const { bogo_config } = offer;
  let eligibleBuyItems = [];
  let eligibleGetItems = [];

  // Preload all products for better performance
  const productIds = [...new Set(cart.items.map(item => item.productId))];
  const products = await Product.find({ _id: { $in: productIds } }).populate('categories');
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  // Find eligible buy items
  for (const item of cart.items) {
    const isEligible = await isItemEligibleForBOGO(item, bogo_config.buy, productMap);
    if (isEligible) {
      eligibleBuyItems.push(item);
    }
  }

  // Calculate how many free items user gets
  const totalBuyQuantity = eligibleBuyItems.reduce((sum, item) => sum + item.quantity, 0);
  const freeQuantity = Math.floor(totalBuyQuantity / bogo_config.buy.quantity) * bogo_config.get.quantity;

  // Apply max_free_quantity cap - enforce to prevent unlimited free items
  const maxFreeQuantity = bogo_config.max_free_quantity || 1;
  const cappedFreeQuantity = Math.min(freeQuantity, maxFreeQuantity);

  if (cappedFreeQuantity <= 0) {
    return { success: false, reason: "Insufficient buy quantity" };
  }

  // Find eligible get items
  if (bogo_config.get.scope === 'same') {
    // Same product/category BOGO - use eligible buy items
    eligibleGetItems = [...eligibleBuyItems];
  } else {
    // Different products/categories
    for (const item of cart.items) {
      const isEligible = await isItemEligibleForBOGO(item, bogo_config.get, productMap);
      if (isEligible) {
        eligibleGetItems.push(item);
      }
    }
  }

  if (eligibleGetItems.length === 0) {
    return { success: false, reason: "No eligible get items" };
  }

  // Calculate discount
  let discountAmount = 0;
  const application = {
    offerId: offer._id,
    offerType: "bogo",
    title: offer.title,
    freeItems: [],
    discountAmount: 0
  };

  let remainingFreeQuantity = cappedFreeQuantity;

  // Sort items based on apply_to rule
  if (bogo_config.apply_to === 'cheapest') {
    eligibleGetItems.sort((a, b) => a.price - b.price);
  } else {
    // first_matched - keep original order
  }

  for (const item of eligibleGetItems) {
    if (remainingFreeQuantity <= 0) break;

    const itemFreeQuantity = Math.min(item.quantity, remainingFreeQuantity);
    let itemDiscount = 0;

    if (bogo_config.get.discount_type === 'FREE') {
      itemDiscount = item.price * itemFreeQuantity;
    } else if (bogo_config.get.discount_type === 'PERCENT') {
      itemDiscount = (item.price * itemFreeQuantity * bogo_config.get.discount_value) / 100;
    }

    discountAmount += itemDiscount;
    application.freeItems.push({
      productId: item.productId,
      quantity: itemFreeQuantity,
      discount: itemDiscount,
      discountType: bogo_config.get.discount_type,
      discountValue: bogo_config.get.discount_value
    });

    remainingFreeQuantity -= itemFreeQuantity;
  }

  application.discountAmount = discountAmount;

  return { success: true, discountAmount, application };
}

// Flash Sale Processing
async function processFlashSale(offer, cart) {
  const { flash_config } = offer;
  let discountAmount = 0;
  const application = {
    offerId: offer._id,
    offerType: "flash",
    title: offer.title,
    discountedItems: [],
    discountAmount: 0
  };

  for (const item of cart.items) {
    const isEligible = await isItemEligibleForFlash(item, flash_config.applicable_products, flash_config.applicable_categories);
    if (isEligible) {
      let itemDiscount = 0;
      
      if (flash_config.discount_type === "percentage") {
        itemDiscount = (item.price * item.quantity * flash_config.discount_value) / 100;
      } else {
        itemDiscount = flash_config.discount_value * item.quantity;
      }

      // Apply max discount cap if set
      if (flash_config.max_discount && itemDiscount > flash_config.max_discount) {
        itemDiscount = flash_config.max_discount;
      }

      discountAmount += itemDiscount;
      application.discountedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        discount: itemDiscount
      });
    }
  }

  application.discountAmount = discountAmount;

  return discountAmount > 0 ? { success: true, discountAmount, application } : { success: false, reason: "No eligible items" };
}

// Category Discount Processing
async function processCategoryDiscount(offer, cart) {
  const { category_config } = offer;
  let discountAmount = 0;
  const application = {
    offerId: offer._id,
    offerType: "category_discount",
    title: offer.title,
    discountedItems: [],
    discountAmount: 0
  };

  for (const item of cart.items) {
    const isEligible = await isItemEligibleForCategory(item, category_config.target_categories);
    if (isEligible) {
      let itemDiscount = 0;
      
      if (category_config.discount_type === "percentage") {
        itemDiscount = (item.price * item.quantity * category_config.discount_value) / 100;
      } else {
        itemDiscount = category_config.discount_value * item.quantity;
      }

      // Apply max discount cap if set
      if (category_config.max_discount && itemDiscount > category_config.max_discount) {
        itemDiscount = category_config.max_discount;
      }

      discountAmount += itemDiscount;
      application.discountedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        discount: itemDiscount
      });
    }
  }

  application.discountAmount = discountAmount;

  return discountAmount > 0 ? { success: true, discountAmount, application } : { success: false, reason: "No eligible items" };
}

// Store-wide Discount Processing
async function processStorewideDiscount(offer, cart) {
  const { storewide_config } = offer;
  
  // Check minimum order value
  if (storewide_config.min_order_value && cart.total < storewide_config.min_order_value) {
    return { success: false, reason: "Minimum order value not met" };
  }

  let discountAmount = 0;
  const application = {
    offerId: offer._id,
    offerType: "storewide",
    title: offer.title,
    discountAmount: 0
  };

  if (storewide_config.discount_type === "percentage") {
    discountAmount = (cart.total * storewide_config.discount_value) / 100;
  } else {
    discountAmount = storewide_config.discount_value;
  }

  // Apply max discount cap if set
  if (storewide_config.max_discount && discountAmount > storewide_config.max_discount) {
    discountAmount = storewide_config.max_discount;
  }

  application.discountAmount = discountAmount;

  return discountAmount > 0 ? { success: true, discountAmount, application } : { success: false, reason: "No discount applicable" };
}

// Helper function to validate offer type isolation
function getActiveConfig(offer) {
  switch (offer.offer_type) {
    case "bogo":
      return offer.bogo_config && Object.keys(offer.bogo_config).length > 0 ? offer.bogo_config : null;
    case "flash":
      return offer.flash_config && Object.keys(offer.flash_config).length > 0 ? offer.flash_config : null;
    case "category_discount":
      return offer.category_config && Object.keys(offer.category_config).length > 0 ? offer.category_config : null;
    case "storewide":
      return offer.storewide_config && Object.keys(offer.storewide_config).length > 0 ? offer.storewide_config : null;
    default:
      return null;
  }
}

// Helper function to check item eligibility for BOGO
async function isItemEligibleForBOGO(item, config, productMap) {
  const product = productMap.get(item.productId.toString());
  if (!product) return false;

  // Check if product is in included products
  if (config.scope === 'product' && config.product_ids && config.product_ids.length > 0) {
    return config.product_ids.includes(item.productId.toString());
  }

  // Check if product is in included categories
  if (config.scope === 'category' && config.category_ids && config.category_ids.length > 0) {
    const productCategoryIds = product.categories.map(cat => 
      typeof cat === 'string' ? cat : cat._id.toString()
    );

    return config.category_ids.some(catId => productCategoryIds.includes(catId.toString()));
  }

  return false;
}

// Helper function to check item eligibility for Flash Sale
async function isItemEligibleForFlash(item, products, categories) {
  // Check if product is in included products
  if (products && products.length > 0) {
    return products.includes(item.productId);
  }

  // Check if product is in included categories
  if (categories && categories.length > 0) {
    const product = await Product.findById(item.productId).populate('categories');
    if (!product) return false;

    const productCategoryIds = product.categories.map(cat => 
      typeof cat === 'string' ? cat : cat._id.toString()
    );

    return categories.some(catId => productCategoryIds.includes(catId.toString()));
  }

  return true; // If no specific products/categories, all items are eligible
}

// Helper function to check item eligibility for Category Discount
async function isItemEligibleForCategory(item, targetCategories) {
  if (!targetCategories || targetCategories.length === 0) {
    return false;
  }

  const product = await Product.findById(item.productId).populate('categories');
  if (!product) return false;

  const productCategoryIds = product.categories.map(cat => 
    typeof cat === 'string' ? cat : cat._id.toString()
  );

  return targetCategories.some(catId => productCategoryIds.includes(catId.toString()));
}

module.exports = router;
