const mongoose = require("mongoose");

const couponUsageSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  used_at: { type: Date, default: Date.now },
  order_id: { type: String, required: true },
  discount_amount: { type: Number, required: true },
  original_total: { type: Number, required: true },
  final_total: { type: Number, required: true }
});

const couponAnalyticsSchema = new mongoose.Schema({
  views: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  apply_attempts: { type: Number, default: 0 },
  apply_success: { type: Number, default: 0 },
  total_revenue_impact: { type: Number, default: 0 },
  total_discount_given: { type: Number, default: 0 },
  conversion_rate: { type: Number, default: 0 },
  last_updated: { type: Date, default: Date.now }
});

const couponSchema = new mongoose.Schema({
  // Identity & Lifecycle
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Z0-9]{3,20}$/.test(v);
      },
      message: 'Coupon code must be 3-20 characters, uppercase letters and numbers only'
    }
  },
  campaign_name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  is_active: { type: Boolean, default: true },
  published: { type: Boolean, default: true },
  status_reason: { type: String, trim: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  timezone: { 
    type: String, 
    default: "Asia/Kolkata",
    validate: {
      validator: function(v) {
        return /^([A-Za-z_]+\/[A-Za-z_]+)$/.test(v);
      },
      message: 'Invalid timezone format'
    }
  },

  // Discount Definition
  discount_type: { 
    type: String, 
    enum: ["percentage", "flat"], 
    required: true 
  },
  discount_value: { 
    type: Number, 
    required: true,
    min: [0.01, 'Discount value must be greater than 0'],
    validate: {
      validator: function(v) {
        if (this.discount_type === "percentage") {
          return v > 0 && v <= 100;
        }
        return v > 0;
      },
      message: function() {
        return this.discount_type === "percentage" 
          ? 'Percentage discount must be between 0.01 and 100'
          : 'Flat discount must be greater than 0';
      }
    }
  },
  max_discount: { 
    type: Number,
    required: function() {
      return this.discount_type === "percentage";
    },
    min: [0, 'Max discount cannot be negative'],
    validate: {
      validator: function(v) {
        if (this.discount_type === "percentage") {
          return v > 0;
        }
        return true;
      },
      message: 'Max discount is required for percentage coupons'
    }
  },

  // Applicability Scope (MANDATORY)
  applicable_on: { 
    type: String, 
    enum: ["cart", "product", "category", "variant", "shipping"], 
    required: true 
  },
  applicable_scope: { 
    type: String, 
    enum: ["all", "selected"], 
    required: true 
  },
  applicable_categories: [{
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'subcategories' }]
  }],
  applied_products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  applied_variants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Cart & User Constraints
  min_purchase: { 
    type: Number, 
    default: 0,
    min: [0, 'Minimum purchase cannot be negative']
  },
  max_purchase: { 
    type: Number,
    min: [0, 'Maximum purchase cannot be negative'],
    validate: {
      validator: function(v) {
        return !v || v > this.min_purchase;
      },
      message: 'Maximum purchase must be greater than minimum purchase'
    }
  },
  new_user_only: { type: Boolean, default: false },
  first_order_only: { type: Boolean, default: false },
  allowed_user_ids: [{ type: String }],
  excluded_user_ids: [{ type: String }],

  // Usage Controls
  usage_limit: { 
    type: Number,
    min: [1, 'Usage limit must be at least 1']
  },
  used_count: { type: Number, default: 0 },
  limit_per_user: { 
    type: Number,
    min: [1, 'Per-user limit must be at least 1']
  },
  usage_history: [couponUsageSchema],

  // Conflict Resolution
  priority: { 
    type: Number, 
    default: 0,
    min: 0,
    validate: {
      validator: function(v) {
        if (this.is_stackable === false) {
          return v >= 0;
        }
        return true;
      },
      message: 'Priority is required when coupon is not stackable'
    }
  },
  is_stackable: { type: Boolean, default: false },
  excluded_coupon_ids: [{ type: String }],

  // Display Controls (UI only)
  visibility_options: {
    show_on_checkout: { type: Boolean, default: true },
    show_on_homepage: { type: Boolean, default: false },
    show_on_product_page: { type: Boolean, default: false },
    show_in_cart: { type: Boolean, default: true }
  },
  auto_apply: { type: Boolean, default: false },

  // Analytics and Tracking
  analytics: couponAnalyticsSchema,

  // Audit
  created_by: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_used_at: { type: Date }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes for performance
couponSchema.index({ code: 1 });
couponSchema.index({ start_date: 1, end_date: 1 });
couponSchema.index({ is_active: 1, published: 1 });
couponSchema.index({ applicable_categories: 1 });
couponSchema.index({ applied_products: 1 });
couponSchema.index({ applied_variants: 1 });
couponSchema.index({ priority: -1 });

// Custom validation for business rules
couponSchema.pre('save', function(next) {
  const errors = [];

  // Rule 1: end_date > start_date
  if (this.end_date <= this.start_date) {
    errors.push('End date must be after start date');
  }

  // Rule 2: Coupon duration minimum (1 hour)
  const minDuration = 60 * 60 * 1000; // 1 hour in milliseconds
  if ((this.end_date - this.start_date) < minDuration) {
    errors.push('Coupon duration must be at least 1 hour');
  }

  // Rule 3: Percentage coupons MUST have max_discount
  if (this.discount_type === 'percentage' && (!this.max_discount || this.max_discount <= 0)) {
    errors.push('Percentage coupons must have a valid max_discount');
  }

  // Rule 4: Max discount logic for percentage coupons
  if (this.discount_type === 'percentage' && this.max_discount) {
    const maxPossibleDiscount = (this.min_purchase * this.discount_value) / 100;
    if (this.max_discount < maxPossibleDiscount) {
      errors.push(`max_discount (${this.max_discount}) must be >= ${maxPossibleDiscount.toFixed(2)} for ${this.discount_value}% discount on min_purchase ${this.min_purchase}`);
    }
  }

  // Rule 5: At least ONE usage limiter must exist
  if (!this.usage_limit && !this.limit_per_user) {
    errors.push('At least one usage limiter (usage_limit or limit_per_user) must be specified');
  }

  // Rule 6: Priority required when not stackable
  if (this.is_stackable === false && this.priority === undefined) {
    errors.push('Priority is required when coupon is not stackable');
  }

  // Rule 7: Empty applicability arrays NOT allowed unless applicable_scope = all
  if (this.applicable_scope === 'selected') {
    if (this.applicable_on === 'category' && (!this.applicable_categories || this.applicable_categories.length === 0)) {
      errors.push('applicable_categories cannot be empty when applicable_scope is selected and applicable_on is category');
    }
    if (this.applicable_on === 'product' && (!this.applied_products || this.applied_products.length === 0)) {
      errors.push('applied_products cannot be empty when applicable_scope is selected and applicable_on is product');
    }
    if (this.applicable_on === 'variant' && (!this.applied_variants || this.applied_variants.length === 0)) {
      errors.push('applied_variants cannot be empty when applicable_scope is selected and applicable_on is variant');
    }
  }

  // Rule 8: Campaign name and code consistency
  if (!this.campaign_name || this.campaign_name.trim().length === 0) {
    errors.push('Campaign name is required');
  }

  if (errors.length > 0) {
    return next(new Error(errors.join('; ')));
  }

  next();
});

// Virtual for checking if coupon is currently valid (timezone aware)
couponSchema.virtual('is_valid').get(function() {
  const now = new Date();
  
  // Convert dates to the coupon's timezone for comparison
  const nowInTimezone = new Date(now.toLocaleString("en-US", { timeZone: this.timezone }));
  const startDateInTimezone = new Date(this.start_date.toLocaleString("en-US", { timeZone: this.timezone }));
  const endDateInTimezone = new Date(this.end_date.toLocaleString("en-US", { timeZone: this.timezone }));

  return this.is_active && 
         this.published && 
         nowInTimezone >= startDateInTimezone && 
         nowInTimezone <= endDateInTimezone &&
         (this.usage_limit === null || this.used_count < this.usage_limit);
});

// Method to check if user can use this coupon
couponSchema.methods.canUserUse = function(userId, userOrderCount = 0) {
  if (!this.is_valid) return { canUse: false, reason: 'Coupon is not valid' };
  
  // Check new user restriction
  if (this.new_user_only && userOrderCount > 0) {
    return { canUse: false, reason: 'Coupon only valid for new users' };
  }
  
  // Check first order restriction
  if (this.first_order_only && userOrderCount > 0) {
    return { canUse: false, reason: 'Coupon only valid for first order' };
  }
  
  // Check per-user limit
  if (this.limit_per_user) {
    const userUsageCount = this.usage_history.filter(usage => usage.user_id === userId).length;
    if (userUsageCount >= this.limit_per_user) {
      return { canUse: false, reason: 'User has exceeded usage limit' };
    }
  }
  
  // Check if user is in allowed users list (if specified)
  if (this.allowed_user_ids && this.allowed_user_ids.length > 0 && !this.allowed_user_ids.includes(userId)) {
    return { canUse: false, reason: 'User not in allowed list' };
  }
  
  // Check if user is in excluded users list
  if (this.excluded_user_ids && this.excluded_user_ids.includes(userId)) {
    return { canUse: false, reason: 'User is excluded from this coupon' };
  }
  
  return { canUse: true };
};

// Method to calculate discount on cart
couponSchema.methods.calculateDiscount = function(cartTotal, eligibleItems = []) {
  let discount = 0;

  if (this.discount_type === 'percentage') {
    discount = (cartTotal * this.discount_value) / 100;
    // Apply max discount limit
    if (this.max_discount && discount > this.max_discount) {
      discount = this.max_discount;
    }
  } else if (this.discount_type === 'flat') {
    discount = Math.min(this.discount_value, cartTotal);
  }

  return Math.max(0, discount);
};

// Method to record coupon usage
couponSchema.methods.recordUsage = function(userId, orderId, discountAmount, originalTotal, finalTotal) {
  this.used_count += 1;
  this.usage_history.push({
    user_id: userId,
    order_id: orderId,
    discount_amount: discountAmount,
    original_total: originalTotal,
    final_total: finalTotal
  });
  this.last_used_at = new Date();
  
  // Update analytics
  this.analytics.apply_success += 1;
  this.analytics.total_discount_given += discountAmount;
  this.analytics.total_revenue_impact += (originalTotal - finalTotal);
  this.analytics.conversion_rate = this.analytics.apply_success / Math.max(this.analytics.apply_attempts, 1);
  this.analytics.last_updated = new Date();
  
  return this.save();
};

// Method to record analytics events
couponSchema.methods.recordAnalytics = function(eventType) {
  switch(eventType) {
    case 'view':
      this.analytics.views += 1;
      break;
    case 'click':
      this.analytics.clicks += 1;
      break;
    case 'apply_attempt':
      this.analytics.apply_attempts += 1;
      break;
  }
  this.analytics.last_updated = new Date();
  return this.save();
};

module.exports = mongoose.model("Coupon", couponSchema);
