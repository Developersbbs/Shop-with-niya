const mongoose = require("mongoose");

// Variant schema for products that have variants
const variantSchema = new mongoose.Schema({
  name: { type: String },
  sku: { type: String, required: true },
  slug: { type: String, required: true },
  cost_price: { type: Number, required: true },
  selling_price: { type: Number, required: true },
  stock: { type: Number },
  minStock: { type: Number },
  status: {
    type: String,
    enum: ['selling', 'out_of_stock', 'draft', 'archived'],
    default: 'selling'
  },
  images: [{ type: String }],
  attributes: {
    type: Map,
    of: String,
    default: new Map()
  },
  published: { type: Boolean, default: true }
});

// Main product schema with two independent dimensions
const productSchema = new mongoose.Schema(
  {
    // Basic product information
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },

    // Two independent dimensions
    product_nature: {
      type: String,
      enum: ["normal", "combo"],
      required: true,
      default: "normal"
    },

    product_type: {
      type: String,
      enum: ['physical', 'digital'],
      default: 'physical'
    },

    product_structure: {
      type: String,
      enum: ["simple", "variant"],
      required: true,
      default: "simple"
    },

    // Category & Subcategory links
    categories: [
      {
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "categories",
          required: true
        },
        subcategories: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "subcategories"
          }
        ]
      }
    ],

    // Product-level details
    image_url: [{ type: String }],
    sku: { type: String, required: true },

    // Pricing fields - only for simple products
    cost_price: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          const nature = this.product_nature || (this.getUpdate && (this.getUpdate().product_nature || (this.getUpdate().$set && this.getUpdate().$set.product_nature)));
          const structure = this.product_structure || (this.getUpdate && (this.getUpdate().product_structure || (this.getUpdate().$set && this.getUpdate().$set.product_structure)));

          // Only simple products can have pricing at main level
          if (structure === 'simple') {
            return value !== undefined && value !== null && value >= 0;
          }
          // Variant products should not have main pricing
          return value === undefined || value === null;
        },
        message: function () {
          const structure = this.product_structure || (this.getUpdate && (this.getUpdate().product_structure || (this.getUpdate().$set && this.getUpdate().$set.product_structure)));
          if (structure === 'simple') {
            return 'Cost price is required for simple products';
          } else {
            return 'Variant products should not have main product cost price (use variant pricing instead)';
          }
        }
      }
    },

    selling_price: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          const structure = this.product_structure || (this.getUpdate && (this.getUpdate().product_structure || (this.getUpdate().$set && this.getUpdate().$set.product_structure)));

          // Only simple products can have pricing at main level
          if (structure === 'simple') {
            return value !== undefined && value !== null && value >= 0;
          }
          // Variant products should not have main pricing
          return value === undefined || value === null;
        },
        message: function () {
          const structure = this.product_structure || (this.getUpdate && (this.getUpdate().product_structure || (this.getUpdate().$set && this.getUpdate().$set.product_structure)));
          if (structure === 'simple') {
            return 'Selling price is required for simple products';
          } else {
            return 'Variant products should not have main product selling price (use variant pricing instead)';
          }
        }
      }
    },

    // Stock fields - only for simple products (normal or combo)
    baseStock: {
      type: Number,
      validate: {
        validator: function (value) {
          const structure = this.product_structure || (this.getUpdate && (this.getUpdate().product_structure || (this.getUpdate().$set && this.getUpdate().$set.product_structure)));

          // Simple products (normal or combo) can have stock
          if (structure === 'simple') {
            return value !== undefined && value !== null && value >= 0;
          }
          // Variant products should not have stock
          return value === undefined || value === null;
        },
        message: function () {
          const structure = this.product_structure || (this.getUpdate && (this.getUpdate().product_structure || (this.getUpdate().$set && this.getUpdate().$set.product_structure)));
          if (structure === 'simple') {
            return 'Base stock is required for simple products';
          } else {
            return 'Variant products should not have base stock (use variant stock instead)';
          }
        }
      }
    },

    minStock: {
      type: Number,
      validate: {
        validator: function (value) {
          const structure = this.product_structure || (this.getUpdate && (this.getUpdate().product_structure || (this.getUpdate().$set && this.getUpdate().$set.product_structure)));

          // Simple products (normal or combo) can have minStock
          if (structure === 'simple') {
            return value !== undefined && value !== null && value >= 0;
          }
          // Variant products should not have minStock
          return value === undefined || value === null;
        },
        message: function () {
          const structure = this.product_structure || (this.getUpdate && (this.getUpdate().product_structure || (this.getUpdate().$set && this.getUpdate().$set.product_structure)));
          if (structure === 'simple') {
            return 'Min stock is required for simple products';
          } else {
            return 'Variant products should not have min stock';
          }
        }
      }
    },

    // Rating and review fields
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0, min: 0 },
    totalReviews: { type: Number, default: 0, min: 0 },

    // Status field - only for simple normal products
    status: {
      type: String,
      enum: ['selling', 'out_of_stock', 'draft', 'archived'],
      // Don't use required function - handle in pre-save hook instead
      validate: {
        validator: function (value) {
          // Attempt to get nature/structure from document (this) or update context
          const update = this.getUpdate ? this.getUpdate() : null;
          const updateSet = update && update.$set ? update.$set : update;

          const nature = (this.product_nature) || (updateSet && updateSet.product_nature) || 'normal';
          const structure = (this.product_structure) || (updateSet && updateSet.product_structure) || 'simple';

          // If we can't determine nature/structure safely, assume valid to prevent update blocking
          // But here default fallbacks 'normal' / 'simple' are risky if it's actually a variant product.
          // Better: If we are updating a specific field, we usually know the structure.

          // Only enforce if we know it's a simple normal product
          if (nature === 'normal' && structure === 'simple') {
            return value !== undefined && value !== null && value !== '';
          }
          // For other types, status should be null/undefined, OR we allow legacy data
          return true;
        },
        message: 'Status is required for simple normal products'
      }
    },

    // Published field - only for simple normal products
    published: {
      type: Boolean,
      // Don't use required function - handle in pre-save hook instead
      validate: {
        validator: function (value) {
          const update = this.getUpdate ? this.getUpdate() : null;
          const updateSet = update && update.$set ? update.$set : update;

          const nature = (this.product_nature) || (updateSet && updateSet.product_nature) || 'normal';
          const structure = (this.product_structure) || (updateSet && updateSet.product_structure) || 'simple';

          if (nature === 'normal' && structure === 'simple') {
            return value !== undefined && value !== null;
          }
          return true;
        },
        message: 'Published is required for simple normal products'
      }
    },

    // Physical product attributes
    weight: { type: Number },
    color: { type: String },

    // Digital product fields
    file_path: { type: String },
    file_size: { type: Number },
    download_format: { type: String },
    license_type: { type: String },
    download_limit: { type: Number },

    // Variants - only for normal variant products
    product_variants: {
      type: [variantSchema],
      validate: {
        validator: function (value) {
          const nature = this.product_nature || (this.getUpdate && (this.getUpdate().product_nature || (this.getUpdate().$set && this.getUpdate().$set.product_nature)));
          const structure = this.product_structure || (this.getUpdate && (this.getUpdate().product_structure || (this.getUpdate().$set && this.getUpdate().$set.product_structure)));

          // Only normal variant products can have variants
          if (nature === 'normal' && structure === 'variant') {
            return value && value.length > 0;
          }
          // Combo products and simple products should not have variants
          return !value || value.length === 0;
        },
        message: function () {
          const nature = this.product_nature || (this.getUpdate && (this.getUpdate().product_nature || (this.getUpdate().$set && this.getUpdate().$set.product_nature)));
          const structure = this.product_structure || (this.getUpdate && (this.getUpdate().product_structure || (this.getUpdate().$set && this.getUpdate().$set.product_structure)));

          if (nature === 'combo') {
            return 'Combo products cannot have variants';
          } else if (structure === 'simple') {
            return 'Simple products cannot have variants';
          } else {
            return 'Normal variant products must have at least one variant';
          }
        }
      }
    },

    // SEO & metadata
    tags: [{ type: String }],
    seo: {
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }],
      canonical: { type: String },
      robots: { type: String, enum: ['index,follow', 'noindex,nofollow', 'index,nofollow', 'noindex,follow'], default: 'index,follow' },
      ogTitle: { type: String },
      ogDescription: { type: String },
      ogImage: { type: String }
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

// Pre-save hook for validation and auto-setting fields
productSchema.pre('save', function (next) {
  // Validation: Combo products must always be simple
  if (this.product_nature === 'combo' && this.product_structure !== 'simple') {
    return next(new Error('Combo products must always be simple (cannot have variants)'));
  }

  // Validation: Normal products can be simple or variant
  if (this.product_nature === 'normal' && !['simple', 'variant'].includes(this.product_structure)) {
    return next(new Error('Normal products must be either simple or variant'));
  }

  // Auto-set status for simple normal products based on stock
  if (this.product_nature === 'normal' && this.product_structure === 'simple') {
    if (this.baseStock !== undefined && this.minStock !== undefined) {
      if (this.baseStock <= this.minStock) {
        this.status = 'out_of_stock';
      } else {
        this.status = 'selling';
      }
    } else {
      this.status = 'draft';
    }

    // Set default published value if not provided
    if (this.published === undefined || this.published === null) {
      this.published = false; // Default to unpublished for new products
    }
  }

  // Ensure combo products don't have stock-related fields
  if (this.product_nature === 'combo') {
    this.baseStock = undefined;
    this.minStock = undefined;
    this.status = undefined;
    this.published = undefined;
  }

  // Ensure variant products don't have stock-related fields at main level
  if (this.product_structure === 'variant') {
    this.baseStock = undefined;
    this.minStock = undefined;
    this.cost_price = undefined;
    this.selling_price = undefined;
    this.status = undefined;
    this.published = undefined;
  }

  // Set status for each variant based on their stock and minStock
  if (this.product_variants && this.product_variants.length > 0) {
    this.product_variants.forEach(variant => {
      if (variant.stock !== undefined && variant.minStock !== undefined) {
        if (variant.stock <= variant.minStock) {
          variant.status = 'out_of_stock';
        } else {
          variant.status = 'selling';
        }
      } else {
        variant.status = 'draft';
      }

      if (variant.status === 'draft') {
        variant.published = false;
      }
    });

    // Validate variant SKUs are unique within the product
    const skus = this.product_variants.map(v => v.sku);
    const uniqueSkus = new Set(skus);

    if (skus.length !== uniqueSkus.size) {
      return next(new Error('Duplicate variant SKUs detected within the product'));
    }
  }

  // Auto-generate SEO canonical URL (only for normal products)
  if (this.name && this.slug && this.product_nature !== 'combo') {
    if (!this.seo) {
      this.seo = {};
    }
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://yourstore.com';
    this.seo.canonical = `${baseUrl}/products/${this.slug}`;
  }

  next();
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Indexes for performance
productSchema.index({ product_nature: 1, product_structure: 1 });
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ published: 1 });
productSchema.index({ status: 1 });

// Compound index for variant SKU uniqueness
variantSchema.index({ sku: 1 });

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
