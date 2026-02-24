const mongoose = require("mongoose");

// Analytics Sub-document Schema
const offerAnalyticsSchema = new mongoose.Schema({
  views: { type: Number, default: 0 },
  cart_attempts: { type: Number, default: 0 },
  applied_success: { type: Number, default: 0 },
  total_discount_given: { type: Number, default: 0 },
  total_revenue_impact: { type: Number, default: 0 },
  conversion_rate: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now },
  daily_stats: [{
    date: { type: Date, required: true },
    views: { type: Number, default: 0 },
    cart_attempts: { type: Number, default: 0 },
    applied_success: { type: Number, default: 0 },
    discount_given: { type: Number, default: 0 },
    revenue_impact: { type: Number, default: 0 }
  }],
  hourly_stats: [{
    hour: { type: Number, required: true }, // 0-23
    date: { type: Date, required: true },
    views: { type: Number, default: 0 },
    cart_attempts: { type: Number, default: 0 },
    applied_success: { type: Number, default: 0 },
    discount_given: { type: Number, default: 0 },
    revenue_impact: { type: Number, default: 0 }
  }],
  product_impact: [{
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    applications: { type: Number, default: 0 },
    discount_given: { type: Number, default: 0 },
    revenue_impact: { type: Number, default: 0 }
  }]
});

// BOGO Configuration Sub-document Schema
const bogoConfigSchema = new mongoose.Schema({
  buy: {
    scope: { type: String, enum: ["product", "category"], required: true },
    product_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    category_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    quantity: { type: Number, required: true, min: 1 }
  },
  get: {
    scope: { type: String, enum: ["same", "product", "category"], required: true },
    product_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    category_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    quantity: { type: Number, required: true, min: 1 },
    discount_type: { type: String, enum: ["FREE", "PERCENT"], required: true },
    discount_value: { type: Number, min: 0, max: 100, required: true }
  },
  apply_to: { type: String, enum: ["cheapest", "first_matched"], default: "cheapest" },
  max_free_quantity: { type: Number, min: 0 }
});

// Flash Sale Configuration Sub-document Schema
const flashConfigSchema = new mongoose.Schema({
  discount_type: { type: String, enum: ["percentage", "fixed"], required: true },
  discount_value: { type: Number, required: true, min: 0 },
  max_discount: { type: Number, min: 0 },
  applicable_products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  applicable_categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  applicable_subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" }],
  stackable_with_coupon: { type: Boolean, default: false }
});

// Category Discount Configuration Sub-document Schema
const categoryConfigSchema = new mongoose.Schema({
  target_categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true }],
  target_subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" }],
  discount_type: { type: String, enum: ["percentage", "fixed"], required: true },
  discount_value: { type: Number, required: true, min: 0 },
  max_discount: { type: Number, min: 0 },
  stackable_with_coupon: { type: Boolean, default: false },
  apply_to_sale_items: { type: Boolean, default: false }
});

// Store-wide Configuration Sub-document Schema
const storewideConfigSchema = new mongoose.Schema({
  discount_type: { type: String, enum: ["percentage", "fixed"], required: true },
  discount_value: { type: Number, required: true, min: 0 },
  max_discount: { type: Number, min: 0 },
  min_order_value: { type: Number, min: 0 },
  exclude_sale_items: { type: Boolean, default: true },
  stackable_with_coupon: { type: Boolean, default: false }
});

// Usage Tracking Sub-document Schema
const usageTrackingSchema = new mongoose.Schema({
  user_usage: [{
    user_id: { type: String, required: true },
    usage_count: { type: Number, default: 0 },
    last_used: { type: Date, default: Date.now },
    total_discount_received: { type: Number, default: 0 }
  }]
  // Removed ip_usage to enforce never relying on IP alone
});

// Main Offer Schema
const offerSchema = new mongoose.Schema({
  // Basic Details
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: false, unique: true, lowercase: true, trim: true },
  description: { type: String, maxlength: 2000 },
  image_url: { type: String },
  banner_image: { type: String },

  // Offer Configuration
  offer_type: {
    type: String,
    enum: ["bogo", "flash", "category_discount", "storewide"],
    required: false
  },
  priority: { type: Number, default: 0, min: 0, max: 999 },
  status: {
    type: String,
    enum: ["draft", "active", "disabled"],
    default: "active"
  },

  // Auto-apply is always true for offers
  auto_apply: { type: Boolean, default: true },

  // Date & Usage Configuration
  start_date: { type: Date, required: false },
  end_date: { type: Date, required: false },
  usage_limit: { type: Number, min: 0 },
  used_count: { type: Number, default: 0 },
  limit_per_user: { type: Number, min: 0 },
  allow_guest_users: { type: Boolean, default: true },

  // Status Flags
  is_active: { type: Boolean, default: true },
  published: { type: Boolean, default: false },

  // Priority and Stacking
  priority: { type: Number, default: 50, min: 1, max: 100 },
  is_stackable: { type: Boolean, default: false },
  excluded_offer_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Offer" }],

  // Eligibility Targeting
  applicable_users: [{ type: String }],
  excluded_users: [{ type: String }],
  user_segments: [{ type: String }], // VIP, NEW, RETURNING, etc

  // Product/Category Targeting
  included_categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  included_subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" }],
  included_products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  excluded_categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  excluded_subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" }],
  excluded_products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  excluded_brands: [{ type: String }],
  exclude_out_of_stock: { type: Boolean, default: true },

  // Offer Type Specific Configurations
  bogo_config: bogoConfigSchema,
  flash_config: flashConfigSchema,
  category_config: categoryConfigSchema,
  storewide_config: storewideConfigSchema,

  // Usage Tracking
  usage_tracking: usageTrackingSchema,

  // Analytics
  analytics: offerAnalyticsSchema,

  // Metadata
  last_updated_by: { type: String },
  tags: [{ type: String, trim: true }],
  notes: { type: String, maxlength: 1000 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
offerSchema.index({ offer_type: 1, status: 1, published: 1 });
offerSchema.index({ start_date: 1, end_date: 1 });
offerSchema.index({ priority: -1, is_active: 1 }); // For priority sorting
offerSchema.index({ priority: -1 });
offerSchema.index({ slug: 1 });
offerSchema.index({ "analytics.product_impact.product_id": 1 });
offerSchema.index({ "usage_tracking.user_usage.user_id": 1 });

// Virtuals
offerSchema.virtual('is_expired').get(function () {
  return new Date() > this.end_date;
});

offerSchema.virtual('is_scheduled').get(function () {
  return new Date() < this.start_date;
});

offerSchema.virtual('usage_percentage').get(function () {
  if (!this.usage_limit) return 0;
  return Math.round((this.used_count / this.usage_limit) * 100);
});

offerSchema.virtual('remaining_usage').get(function () {
  if (!this.usage_limit) return null;
  return Math.max(0, this.usage_limit - this.used_count);
});

// Pre-save middleware for automatic status determination
offerSchema.pre('save', function (next) {
  // Check if offer has complete details for active status
  const hasCompleteDetails = this.validateOfferCompleteness();

  // Always set status based on completeness (unless explicitly set to 'disabled')
  if (this.status !== 'disabled') {
    // If not published, force status to draft regardless of completeness
    if (!this.published) {
      this.status = 'draft';
    } else {
      this.status = hasCompleteDetails ? 'active' : 'draft';
    }
  }

  next();
});

// Method to validate if offer has complete details
offerSchema.methods.validateOfferCompleteness = function () {
  const requiredFields = [
    'title'
  ];

  // Check basic required fields
  for (const field of requiredFields) {
    if (!this[field]) {
      return false;
    }
  }

  // Check if slug is provided (required for active status)
  if (!this.slug) {
    return false;
  }

  // Check if offer_type is provided (required for active status)
  if (!this.offer_type) {
    return false;
  }

  // Check dates (both must be provided for active status)
  if (!this.start_date || !this.end_date) {
    return false;
  }

  // Check offer type specific configuration
  const configMap = {
    'bogo': 'bogo_config',
    'flash': 'flash_config',
    'category_discount': 'category_config',
    'storewide': 'storewide_config'
  };

  const configField = configMap[this.offer_type];
  if (!configField || !this[configField]) {
    return false;
  }

  const config = this[configField];

  // Validate specific config based on offer type
  switch (this.offer_type) {
    case 'bogo':
      return this.validateBOGOConfig(config);
    case 'flash':
      return this.validateFlashConfig(config);
    case 'category_discount':
      return this.validateCategoryConfig(config);
    case 'storewide':
      return this.validateStorewideConfig(config);
    default:
      return false;
  }
};

// BOGO configuration validation
offerSchema.methods.validateBOGOConfig = function (config) {
  if (!config || !config.buy || !config.get) return false;

  const buyScopeValid = config.buy.scope === "product"
    ? Array.isArray(config.buy.product_ids) && config.buy.product_ids.length > 0
    : Array.isArray(config.buy.category_ids) && config.buy.category_ids.length > 0;

  if (!buyScopeValid || !config.buy.quantity || config.buy.quantity < 1) {
    return false;
  }

  if (!config.get.quantity || config.get.quantity < 1) {
    return false;
  }

  if (config.get.scope === "same") {
    // No selectors required in same scope
    return true;
  }

  if (config.get.scope === "product") {
    return Array.isArray(config.get.product_ids) && config.get.product_ids.length > 0;
  }

  if (config.get.scope === "category") {
    return Array.isArray(config.get.category_ids) && config.get.category_ids.length > 0;
  }

  return false;
};

// Flash configuration validation  
offerSchema.methods.validateFlashConfig = function (config) {
  return config.discount_type &&
    config.discount_value !== undefined &&
    config.discount_value > 0 &&
    (config.applicable_products.length > 0 || config.applicable_categories.length > 0 || config.applicable_subcategories.length > 0);
};

// Category configuration validation
offerSchema.methods.validateCategoryConfig = function (config) {
  return config.discount_type &&
    config.discount_value !== undefined &&
    config.discount_value > 0 &&
    config.target_categories.length > 0;
};

// Storewide configuration validation
offerSchema.methods.validateStorewideConfig = function (config) {
  return config.discount_type &&
    config.discount_value !== undefined &&
    config.discount_value > 0;
};

// Pre-save middleware for offer type isolation validation
offerSchema.pre('save', function (next) {
  const offerTypes = ['bogo', 'flash', 'category_discount', 'storewide'];
  const configs = [
    this.bogo_config,
    this.flash_config,
    this.category_config,
    this.storewide_config
  ];

  // Count non-null configs
  const activeConfigs = configs.filter(config =>
    config && Object.keys(config).length > 0
  );

  // Ensure exactly one config is active
  if (activeConfigs.length !== 1) {
    return next(new Error('Exactly one offer configuration must be active'));
  }

  // Validate that the active config matches the offer_type
  const expectedConfigIndex = offerTypes.indexOf(this.offer_type);
  if (expectedConfigIndex === -1 || !configs[expectedConfigIndex] || Object.keys(configs[expectedConfigIndex]).length === 0) {
    return next(new Error(`Active configuration must match offer_type: ${this.offer_type}`));
  }

  // BOGO specific validations
  if (this.offer_type === 'bogo' && this.bogo_config) {
    // Enforce max_free_quantity with default of 1
    if (!this.bogo_config.max_free_quantity || this.bogo_config.max_free_quantity <= 0) {
      this.bogo_config.max_free_quantity = 1;
    }

    // Ensure discount_value = 100 when discount_type = FREE
    if (this.bogo_config.get && this.bogo_config.get.discount_type === 'FREE') {
      this.bogo_config.get.discount_value = 100;
    }
  }

  // Status validation: active offers must be published
  if (this.status === 'active' && !this.published) {
    return next(new Error('Active offers must be published'));
  }

  next();
});

// Pre-save middleware for slug generation
offerSchema.pre('save', function (next) {
  if (this.isModified('title') && (!this.slug || this.slug === '')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Date.now();
  }
  next();
});

// Instance methods
offerSchema.methods.isEligibleUser = function (userId) {
  if (!this.applicable_users.length && !this.excluded_users.length) return true;

  const isIncluded = this.applicable_users.length === 0 || this.applicable_users.includes(userId);
  const isExcluded = this.excluded_users.includes(userId);

  return isIncluded && !isExcluded;
};

offerSchema.methods.canUserUse = function (userId) {
  if (!this.limit_per_user) return true;

  const userUsage = this.usage_tracking.user_usage.find(
    usage => usage.user_id === userId
  );

  return !userUsage || userUsage.usage_count < this.limit_per_user;
};

offerSchema.methods.recordUsage = function (userId, discountAmount) {
  this.used_count += 1;

  // Only track usage for authenticated users - never rely on IP alone
  if (userId) {
    // Update user usage
    let userUsage = this.usage_tracking.user_usage.find(
      usage => usage.user_id === userId
    );

    if (!userUsage) {
      userUsage = {
        user_id: userId,
        usage_count: 0,
        total_discount_received: 0
      };
      this.usage_tracking.user_usage.push(userUsage);
    }

    userUsage.usage_count += 1;
    userUsage.last_used = new Date();
    userUsage.total_discount_received += discountAmount;
  }

  // Update analytics
  this.analytics.applied_success += 1;
  this.analytics.total_discount_given += discountAmount;
  this.analytics.last_updated = new Date();
};

offerSchema.methods.recordView = function () {
  this.analytics.views += 1;
  this.analytics.last_updated = new Date();
};

offerSchema.methods.recordCartAttempt = function () {
  this.analytics.cart_attempts += 1;
  this.analytics.last_updated = new Date();
};

// Static methods
offerSchema.statics.findActiveOffers = function () {
  const now = new Date();
  return this.find({
    published: true,
    is_active: true,
    status: 'active',
    start_date: { $lte: now },
    end_date: { $gte: now }
  }).sort({ priority: -1 });
};

offerSchema.statics.findBySlug = function (slug) {
  return this.findOne({
    slug: slug,
    published: true,
    is_active: true
  }).populate([
    'bogo_config.buy.product_ids',
    'bogo_config.get.product_ids',
    'flash_config.applicable_products',
    'included_products',
    'excluded_products'
  ]);
};

module.exports = mongoose.model("Offer", offerSchema);
