const express = require("express");
const Product = require("../models/Product.js");
const Category = require("../models/Category.js");
const Stock = require("../models/Stock.js");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads/products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config for products
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

const uploadDigitalFile = upload.any();

// HELPER: Stock validation for publish toggle
function validateStockForPublish(product, isPublishing) {
  if (product.product_type === 'digital') {
    return {
      canPublish: true,
      status: 'selling',
      published: isPublishing,
      message: isPublishing ? '✅ Digital product published.' : '🗃️ Digital product archived.',
      stockInfo: 'Digital product - no stock required'
    };
  }

  if (product.product_structure === 'variant') {
    if (product.product_variants && product.product_variants.length > 0) {
      const availableVariants = product.product_variants.filter(v => v.published && v.status === 'selling');
      const hasStock = availableVariants.some(v => v.stock > 0);

      if (isPublishing) {
        if (availableVariants.length === 0) {
          return {
            canPublish: true,
            status: 'out_of_stock',
            published: true,
            message: `⚠️ Product published but marked as out of stock. No variants have stock.`,
            stockInfo: `No variants with stock (${product.product_variants.length} total variants)`
          };
        } else {
          const stockInfo = availableVariants.map(v => `${v.name}: ${v.stock}/${v.minStock}`).join(', ');
          return {
            canPublish: true,
            status: hasStock ? 'selling' : 'out_of_stock',
            published: true,
            message: hasStock
              ? `✅ Product published. Available variants: ${stockInfo}`
              : `⚠️ Product published but marked as out of stock. No variants have sufficient stock.`,
            stockInfo: stockInfo
          };
        }
      } else {
        const stockInfo = product.product_variants.map(v => `${v.name}: ${v.stock}/${v.minStock}`).join(', ');
        return {
          canPublish: true,
          status: 'archived',
          published: false,
          message: `🗃️ Product archived. Current variant stock: ${stockInfo}. Are you sure?`,
          stockInfo: stockInfo
        };
      }
    } else {
      return {
        canPublish: false,
        status: 'draft',
        published: false,
        message: '⚠️ Please add variants before publishing.',
        stockInfo: 'No variants configured'
      };
    }
  }

  if (product.product_structure === 'simple') {
    const baseStock = product.baseStock || 0;
    const minStock = product.minStock || 0;

    if (isPublishing) {
      if (baseStock > 0 && minStock > 0) {
        return {
          canPublish: true,
          status: 'selling',
          published: true,
          message: `✅ Product published. Stock: ${baseStock} / Min: ${minStock}.`,
          stockInfo: `${baseStock}/${minStock}`
        };
      } else if (baseStock === 0) {
        return {
          canPublish: true,
          status: 'out_of_stock',
          published: true,
          message: `⚠️ Product is visible but currently out of stock.`,
          stockInfo: `${baseStock}/${minStock}`
        };
      } else {
        return {
          canPublish: false,
          status: 'draft',
          published: false,
          message: `⚠️ Please add Base Stock and Minimum Stock before publishing.`,
          stockInfo: `Base: ${baseStock}, Min: ${minStock}`
        };
      }
    } else {
      return {
        canPublish: true,
        status: 'archived',
        published: false,
        message: `🗃️ Product archived. Current stock: ${baseStock} / Min: ${minStock}. Are you sure?`,
        stockInfo: `${baseStock}/${minStock}`
      };
    }
  }

  return {
    canPublish: false,
    status: 'draft',
    published: false,
    message: 'Unable to determine stock status.',
    stockInfo: 'Unknown product structure'
  };
}

function transformVariantsForDB(variantsData, baseSKU, costPrice, salesPrice, variantImagesMap = {}) {
  if (!variantsData || !variantsData.combinations || variantsData.combinations.length === 0) {
    console.log('🚨 BACKEND: No variants to transform');
    return [];
  }

  console.log('🚨 BACKEND: === TRANSFORMING VARIANTS ===');
  console.log('🚨 BACKEND: variantImagesMap:', variantImagesMap);

  const transformedVariants = variantsData.combinations.map((combo, index) => {
    let sku = combo.sku;
    if (!sku || variantsData.autoGenerateSKU) {
      const attributeValues = Object.entries(combo.attributes || {})
        .filter(([_, value]) => value)
        .map(([key, value]) => String(value).substring(0, 3).toUpperCase())
        .join('-');
      sku = attributeValues ? `${baseSKU.toUpperCase()}-${attributeValues}` : `${baseSKU.toUpperCase()}-${index}`;
    }
    sku = sku.toUpperCase();

    const variantCostPrice = combo.costPrice ?? combo.cost_price ?? costPrice ?? 0;
    const variantSellingPrice = combo.salesPrice ?? combo.selling_price ?? combo.sellingPrice ?? salesPrice ?? 0;

    // Use images already set on combo (either existing URLs or newly replaced ones)
    let variantImages = combo.images || [];

    console.log(`🚨 BACKEND: Variant ${index} images:`, {
      fromCombo: combo.images?.length || 0,
      fromMap: variantImagesMap[index]?.length || 0,
      images: variantImages
    });

    // Only merge from variantImagesMap if combo.images is empty
    // (variantImagesMap is only populated for local file uploads with no Firebase URLs)
    if (variantImagesMap[index] && variantImagesMap[index].length > 0 && variantImages.length === 0) {
      variantImages = variantImagesMap[index];
    }

    const processedAttributes = new Map();
    if (combo.attributes) {
      Object.entries(combo.attributes).forEach(([key, value]) => {
        processedAttributes.set(key, value);
      });
    }

    const attributesObject = {};
    processedAttributes.forEach((value, key) => {
      attributesObject[key] = value;
    });

    let variantStatus = 'draft';
    const variantStock = combo.stock !== undefined ? Number(combo.stock) : 0;
    const variantMinStock = combo.minStock !== undefined ? Number(combo.minStock) : 0;
    const variantPublished = combo.published !== undefined ? combo.published : true;

    if (variantPublished) {
      variantStatus = variantStock > 0 ? 'selling' : 'out_of_stock';
    }

    return {
      name: combo.name,
      sku: sku,
      slug: combo.slug,
      cost_price: Number(variantCostPrice),
      selling_price: Number(variantSellingPrice),
      ...(combo.stock !== undefined && { stock: Number(combo.stock) }),
      ...(combo.minStock !== undefined && { minStock: Number(combo.minStock) }),
      images: variantImages,
      attributes: attributesObject,
      published: variantPublished,
      status: variantStatus
    };
  });

  console.log('🚨 BACKEND: === TRANSFORMATION COMPLETE ===');
  console.log('🚨 BACKEND: Total transformed variants:', transformedVariants.length);

  return transformedVariants;
}

// Test endpoint
router.get("/test1", (req, res) => {
  res.json({ success: true, message: "Test endpoint working" });
});

// STATIC FILE SERVING for product images
router.get("/uploads/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: "Image not found" });
  }

  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };

  res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000");
  res.sendFile(filePath);
});

// GET export products as CSV
router.get("/export/csv", async (req, res) => {
  try {
    const products = await Product.find({})
      .populate({ path: "categories.category", select: "name slug" })
      .populate({ path: "categories.subcategories", select: "name" })
      .sort({ created_at: -1 });

    if (!products || products.length === 0) {
      return res.status(404).json({ success: false, error: "No products found" });
    }

    const rows = [];

    // Header row
    rows.push([
      "Product Name", "SKU", "Product Type", "Structure", "Status",
      "Published", "Category", "Cost Price", "Sale Price", "Tax %",
      "Stock", "Min Stock", "Tags", "Created At"
    ].join(","));

    for (const product of products) {
      const categoryName = product.categories?.[0]?.category?.name || "—";
      const tags = (product.tags || []).join("; ");

      if (product.product_structure === "variant" && product.product_variants?.length > 0) {
        for (const variant of product.product_variants) {
          rows.push([
            `"${(product.name || "").replace(/"/g, '""')} - ${(variant.name || "").replace(/"/g, '""')}"`,
            `"${variant.sku || ""}"`,
            `"${product.product_type || "physical"}"`,
            `"variant"`,
            `"${variant.status || ""}"`,
            `"${variant.published ? "Yes" : "No"}"`,
            `"${categoryName}"`,
            variant.cost_price ?? 0,
            variant.selling_price ?? 0,
            product.tax_percentage ?? 0,

            variant.stock ?? 0,
            variant.minStock ?? 0,
            `"${tags}"`,
            `"${product.created_at ? new Date(product.created_at).toISOString().split("T")[0] : ""}"`
          ].join(","));
        }
      } else {
        rows.push([
          `"${(product.name || "").replace(/"/g, '""')}"`,
          `"${product.sku || ""}"`,
          `"${product.product_type || "physical"}"`,
          `"simple"`,
          `"${product.status || ""}"`,
          `"${product.published ? "Yes" : "No"}"`,
          `"${categoryName}"`,
          product.cost_price ?? 0,
          product.selling_price ?? 0,
          product.tax_percentage ?? 0,
          product.baseStock ?? 0,
          product.minStock ?? 0,
          `"${tags}"`,
          `"${product.created_at ? new Date(product.created_at).toISOString().split("T")[0] : ""}"`
        ].join(","));
      }
    }

    const csv = rows.join("\n");
    const filename = `products-export-${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csv);

  } catch (err) {
    console.error("Export CSV error:", err);
    res.status(500).json({ success: false, error: "Failed to export products" });
  }
});

// GET all products
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      subcategory,
      priceSort,
      status,
      published,
      dateSort,
      productType,
      exclude_combo,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let filter = {};

    if (search) filter.name = { $regex: search, $options: "i" };

    if (category) {
      try {
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) filter["categories.category"] = categoryDoc._id;
      } catch (categoryError) {
        console.error("Error finding category:", categoryError);
      }
    }

    if (subcategory && subcategory !== 'all') {
      try {
        const Subcategory = require("../models/Subcategory.js");
        const subcategoryDoc = await Subcategory.findOne({ slug: subcategory });
        if (subcategoryDoc) filter["categories.subcategories"] = subcategoryDoc._id;
      } catch (subcategoryError) {
        console.error("Error finding subcategory:", subcategoryError);
      }
    }

    if (productType && productType !== 'all') {
      let typeCondition = {};
      if (productType === 'digital') {
        typeCondition = {
          $or: [
            { product_type: 'digital' },
            { product_type: { $exists: false }, file_path: { $exists: true, $ne: null } }
          ]
        };
      } else if (productType === 'physical') {
        typeCondition = {
          $or: [
            { product_type: 'physical' },
            { product_type: { $exists: false }, file_path: { $exists: false } },
            { product_type: { $exists: false }, file_path: null }
          ]
        };
      } else {
        typeCondition = { product_type: productType };
      }
      if (!filter.$and) filter.$and = [];
      filter.$and.push(typeCondition);
    }

    if (published !== undefined) {
      if (published === "true") {
        const publishedCondition = {
          $or: [
            { published: true },
            { product_structure: 'variant', 'product_variants.published': true }
          ]
        };
        if (!filter.$and) filter.$and = [];
        filter.$and.push(publishedCondition);
      } else {
        filter.published = false;
      }
    }

    if (exclude_combo === "true") filter.product_nature = { $ne: "combo" };

    let sort = {};
    if (priceSort) {
      sort.selling_price = priceSort === "lowest-first" ? 1 : -1;
    } else if (dateSort) {
      const [field, direction] = dateSort.split("-");
      const sortField = field === "added" ? "created_at" : "updated_at";
      sort[sortField] = direction === "asc" ? 1 : -1;
    } else {
      sort.created_at = -1;
    }

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate({ path: "categories.category", select: "name slug" })
      .populate({ path: "categories.subcategories", select: "name" });

    const total = await Product.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    const productsData = products.map(product => {
      const productObj = product.toObject();
      if (productObj.product_variants && productObj.product_variants.length > 0) {
        productObj.product_variants = productObj.product_variants.map(variant => {
          if (variant.attributes && variant.attributes instanceof Map) {
            const attributesObj = {};
            variant.attributes.forEach((value, key) => { attributesObj[key] = value; });
            return { ...variant, attributes: attributesObj };
          } else if (variant.attributes && typeof variant.attributes === 'object') {
            const attributesObj = {};
            Object.entries(variant.attributes).forEach(([key, value]) => { attributesObj[key] = value; });
            return { ...variant, attributes: attributesObj };
          }
          return variant;
        });
      }
      return productObj;
    });

    res.json({
      success: true,
      data: productsData,
      totalPages,
      currentPage: pageNum,
      prevPage: pageNum > 1 ? pageNum - 1 : null,
      nextPage: pageNum < totalPages ? pageNum + 1 : null,
      limit: limitNum,
      totalItems: total,
    });
  } catch (err) {
    console.error("Products API Error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET a product by slug
router.get("/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return res.status(400).json({ success: false, error: "Product slug is required" });
    }

    const product = await Product.findOne({ slug })
      .populate({ path: "categories.category", select: "name slug" })
      .populate({ path: "categories.subcategories", select: "name" });

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const productObj = product.toObject();

    if (productObj.product_variants && productObj.product_variants.length > 0) {
      productObj.product_variants = productObj.product_variants.map(variant => {
        const variantWithImageUrl = variant.images ? { ...variant, image_url: variant.images } : variant;
        if (variantWithImageUrl.attributes && variantWithImageUrl.attributes instanceof Map) {
          const attributesObj = {};
          variantWithImageUrl.attributes.forEach((value, key) => { attributesObj[key] = value; });
          return { ...variantWithImageUrl, attributes: attributesObj };
        } else if (variantWithImageUrl.attributes && typeof variantWithImageUrl.attributes === 'object') {
          const attributesObj = {};
          Object.entries(variantWithImageUrl.attributes).forEach(([key, value]) => { attributesObj[key] = value; });
          return { ...variantWithImageUrl, attributes: attributesObj };
        }
        return variantWithImageUrl;
      });
    }

    res.json({ success: true, data: productObj });
  } catch (err) {
    console.error("Product by slug error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch product by slug",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET a product by id
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid product ID format" });
    }

    const product = await Product.findOne({ _id: req.params.id })
      .populate({ path: "categories.category", select: "name slug" })
      .populate({ path: "categories.subcategories", select: "name" });

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const productObj = product.toObject();

    if (productObj.product_variants && productObj.product_variants.length > 0) {
      productObj.product_variants = productObj.product_variants.map(variant => {
        const variantWithImageUrl = variant.images ? { ...variant, image_url: variant.images } : variant;
        if (variantWithImageUrl.attributes && variantWithImageUrl.attributes instanceof Map) {
          const attributesObj = {};
          variantWithImageUrl.attributes.forEach((value, key) => { attributesObj[key] = value; });
          return { ...variantWithImageUrl, attributes: attributesObj };
        } else if (variantWithImageUrl.attributes && typeof variantWithImageUrl.attributes === 'object') {
          const attributesObj = {};
          Object.entries(variantWithImageUrl.attributes).forEach(([key, value]) => { attributesObj[key] = value; });
          return { ...variantWithImageUrl, attributes: attributesObj };
        }
        return variantWithImageUrl;
      });
    }

    res.json({ success: true, data: productObj });
  } catch (err) {
    console.error("Product by ID error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch product",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST a new product
router.post("/", uploadDigitalFile, async (req, res) => {
  try {
    console.log('=== POST PRODUCT DEBUG ===');
    console.log('req.body keys:', Object.keys(req.body));
    console.log('req.body.product_structure:', req.body.product_structure);
    console.log('req.body.product_type:', req.body.product_type);

    // Parse categories
    let categories = [];
    if (req.body.categories) {
      try {
        const parsedCategories = JSON.parse(req.body.categories);
        if (Array.isArray(parsedCategories)) {
          for (const cat of parsedCategories) {
            let categoryId = null;

            if (cat.categoryId) {
              if (typeof cat.categoryId === 'string' && cat.categoryId.length === 24 && /^[a-fA-F0-9]{24}$/.test(cat.categoryId)) {
                categoryId = cat.categoryId;
              }
            } else if (cat.category) {
              if (typeof cat.category === 'string' && cat.category.length === 24 && /^[a-fA-F0-9]{24}$/.test(cat.category)) {
                categoryId = cat.category;
              } else if (typeof cat.category === 'string') {
                try {
                  const Category = require("../models/Category.js");
                  const foundCategory = await Category.findOne({ $or: [{ slug: cat.category }, { name: cat.category }] });
                  if (foundCategory) {
                    categoryId = foundCategory._id.toString();
                  } else {
                    continue;
                  }
                } catch (categoryError) {
                  console.error("Error finding category:", categoryError);
                  continue;
                }
              } else if (cat.category._id || cat.category.id) {
                categoryId = cat.category._id || cat.category.id;
              }
            }

            if (categoryId) {
              let subcategories = [];
              if (cat.subcategoryIds && Array.isArray(cat.subcategoryIds)) {
                for (const subcatId of cat.subcategoryIds) {
                  if (typeof subcatId === 'string' && subcatId.length === 24 && /^[a-fA-F0-9]{24}$/.test(subcatId)) {
                    subcategories.push(subcatId);
                  }
                }
              } else if (cat.subcategories && Array.isArray(cat.subcategories)) {
                for (const subcat of cat.subcategories) {
                  if (typeof subcat === 'string' && subcat.length === 24 && /^[a-fA-F0-9]{24}$/.test(subcat)) {
                    subcategories.push(subcat);
                  } else if (typeof subcat === 'string') {
                    try {
                      const Subcategory = require("../models/Subcategory.js");
                      const foundSubcategory = await Subcategory.findOne({ $or: [{ slug: subcat }, { name: subcat }] });
                      if (foundSubcategory) subcategories.push(foundSubcategory._id.toString());
                    } catch (subcategoryError) {
                      console.error("Error finding subcategory:", subcategoryError);
                    }
                  }
                }
              }
              categories.push({ category: categoryId, subcategories });
            }
          }
        }
      } catch (e) {
        console.error("Error parsing categories JSON:", e);
      }
    }

    let tags = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch (e) {
        tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
      }
    }

    let seoKeywords = [];
    if (req.body.seo_keywords) {
      try {
        seoKeywords = JSON.parse(req.body.seo_keywords);
      } catch (e) {
        console.error("Error parsing seoKeywords JSON:", e);
      }
    }

    let variantsData = null;
    if (req.body.product_variants) {
      try {
        variantsData = JSON.parse(req.body.product_variants);
      } catch (e) {
        console.error("Error parsing variants JSON:", e);
      }
    }

    const productType = req.body.product_type || 'physical';
    const productStructure = req.body.product_structure || req.body.productStructure || 'simple';

    let allImageUrls = [];
    let digitalFile = null;
    let variantImagesMap = {};

    if (req.files && Array.isArray(req.files)) {
      const filesByField = {};
      req.files.forEach(file => {
        if (!filesByField[file.fieldname]) filesByField[file.fieldname] = [];
        filesByField[file.fieldname].push(file);
      });

      const imageFields = Object.keys(filesByField).filter(key =>
        key.startsWith('images[') || key === 'images'
      );
      imageFields.forEach(key => {
        filesByField[key].forEach(file => {
          allImageUrls.push(`/uploads/products/${file.filename}`);
        });
      });

      // ✅ POST: Per-variant detection — only skip map population for variants
      // that already have Firebase URLs. Variants with empty images still get new uploads.
      const variantImageFields = Object.keys(filesByField).filter(key =>
        key.startsWith('variantImages[')
      );
      variantImageFields.forEach(key => {
        const match = key.match(/variantImages\[(\d+)\]\[(\d+)\]/);
        if (!match) return;
        const comboIndex = parseInt(match[1]);
        // Only add to map if this variant doesn't already have Firebase URLs
        const combo = variantsData?.combinations?.[comboIndex];
        const hasFirebaseForThisVariant = combo?.images?.some(
          img => typeof img === 'string' && img.startsWith('http')
        );
        if (!hasFirebaseForThisVariant) {
          if (!variantImagesMap[comboIndex]) variantImagesMap[comboIndex] = [];
          const file = filesByField[key][0];
          if (file) variantImagesMap[comboIndex].push(`/uploads/products/${file.filename}`);
        }
      });

      if (filesByField.fileUpload && filesByField.fileUpload.length > 0) {
        digitalFile = filesByField.fileUpload[0];
      }
    }

    if (allImageUrls.length === 0 && req.body.image_url) {
      try {
        const providedImageUrls = typeof req.body.image_url === 'string'
          ? JSON.parse(req.body.image_url)
          : req.body.image_url;
        if (Array.isArray(providedImageUrls) && providedImageUrls.length > 0) {
          allImageUrls = providedImageUrls;
        }
      } catch (error) {
        console.error('❌ Failed to parse provided image_url payload:', error);
      }
    }

    const productData = {
      name: req.body.name,
      slug: req.body.slug,
      description: req.body.description,
      product_type: productType,
      product_structure: productStructure,
      sku: req.body.sku ? req.body.sku.toUpperCase() : undefined,
      categories: categories,
      cost_price: productStructure === 'simple' ? parseFloat(req.body.cost_price || req.body.costPrice) : undefined,
      selling_price: productStructure === 'simple' ? parseFloat(req.body.selling_price || req.body.salesPrice) : undefined,
      tax_percentage: parseFloat(req.body.tax_percentage || 0),
      image_url: allImageUrls,
      tags: tags,
      ...(productStructure !== 'variant' && { published: req.body.published === 'true' }),
    };

    if (productType === 'physical') {
      if (req.body.stock !== undefined) productData.baseStock = parseInt(req.body.stock);
      if (req.body.min_stock_threshold !== undefined) productData.minStock = parseInt(req.body.min_stock_threshold);
    }

    if (productData.slug) {
      let baseSlug = productData.slug;
      let slugCounter = 1;
      let finalSlug = baseSlug;
      while (await Product.findOne({ slug: finalSlug, _id: { $ne: null } })) {
        finalSlug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
      }
      productData.slug = finalSlug;
    }

    if (req.body.weight) productData.weight = parseFloat(req.body.weight);
    if (req.body.color) productData.color = req.body.color;
    if (req.body.size) productData.size = req.body.size;
    if (req.body.material) productData.material = req.body.material;
    if (req.body.brand) productData.brand = req.body.brand;
    if (req.body.warranty) productData.warranty = req.body.warranty;

    if (productType === 'digital') {
      if (digitalFile) {
        productData.file_path = `/uploads/products/${digitalFile.filename}`;
        productData.file_size = digitalFile.size;
      }
      const downloadFormat = req.body.download_format || req.body.downloadFormat;
      const licenseType = req.body.license_type || req.body.licenseType;
      const downloadLimit = req.body.download_limit || req.body.downloadLimit;
      const fileSize = req.body.file_size || req.body.fileSize;
      if (downloadFormat) productData.download_format = downloadFormat;
      if (licenseType) productData.license_type = licenseType;
      if (downloadLimit) productData.download_limit = parseInt(downloadLimit);
      if (fileSize && !digitalFile) productData.file_size = parseFloat(fileSize);
    }

    const product = new Product(productData);
    product.product_structure = productStructure;

    if (req.body.seo_title || req.body.seo_description || seoKeywords.length > 0 || req.body.seo_canonical || req.body.seo_robots || req.body.seo_og_title || req.body.seo_og_description || req.body.seo_og_image) {
      productData.seo = {};
      if (req.body.seo_title?.trim()) productData.seo.title = req.body.seo_title;
      if (req.body.seo_description?.trim()) productData.seo.description = req.body.seo_description;
      if (seoKeywords?.length > 0) productData.seo.keywords = seoKeywords;
      if (req.body.seo_canonical?.trim()) productData.seo.canonical = req.body.seo_canonical;
      if (req.body.seo_robots) productData.seo.robots = req.body.seo_robots;
      if (req.body.seo_og_title?.trim()) productData.seo.ogTitle = req.body.seo_og_title;
      if (req.body.seo_og_description?.trim()) productData.seo.ogDescription = req.body.seo_og_description;
      if (req.body.seo_og_image?.trim()) productData.seo.ogImage = req.body.seo_og_image;
      product.seo = productData.seo;
    }

    if (variantsData && variantsData.combinations && variantsData.combinations.length > 0) {
      if (req.body.variantImageUrls) {
        try {
          const variantImageUrls = typeof req.body.variantImageUrls === 'string'
            ? JSON.parse(req.body.variantImageUrls)
            : req.body.variantImageUrls;

          Object.entries(variantImageUrls).forEach(([index, urls]) => {
            const idx = parseInt(index);
            if (!isNaN(idx) && variantsData.combinations[idx]) {
              if (!variantsData.combinations[idx].images) variantsData.combinations[idx].images = [];
              const newUrls = Array.isArray(urls) ? urls : [urls];
              const existingSet = new Set(variantsData.combinations[idx].images);
              const uniqueNew = newUrls.filter(u => !existingSet.has(u));
              variantsData.combinations[idx].images = [
                ...variantsData.combinations[idx].images,
                ...uniqueNew
              ].filter(Boolean);
            }
          });
        } catch (e) {
          console.error('Error processing variant image URLs:', e);
        }
      }

      const transformedVariants = transformVariantsForDB(
        variantsData,
        req.body.sku || 'PROD',
        productData.cost_price,
        productData.selling_price,
        variantImagesMap
      );

      if (transformedVariants.length > 0) {
        const finalVariants = transformedVariants.map((variant, index) => ({
          ...variant,
          status: variant.status || 'draft',
          published: variant.published !== undefined ? variant.published : true,
          stock: variant.stock || 0,
          minStock: variant.minStock || 0,
          images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
          attributes: variant.attributes || {},
          created_at: new Date(),
          updated_at: new Date()
        }));

        product.product_variants = finalVariants;
        productData.product_variants = finalVariants;
      }
    }

    await product.save();

    try {
      let staffMember;
      try {
        const Staff = require("../models/Staff.js");
        staffMember = await Staff.findOne({ is_active: true }).sort({ created_at: 1 });
      } catch (staffError) {
        console.error('Error finding staff member:', staffError);
      }

      const stockEntries = [];

      if (productType === 'physical') {
        if (product.product_structure === 'variant') {
          if (product.product_variants && product.product_variants.length > 0) {
            for (const variant of product.product_variants) {
              stockEntries.push({
                productId: product._id,
                variantId: variant._id,
                quantity: variant.stock !== undefined ? variant.stock : null,
                minStock: variant.minStock !== undefined ? variant.minStock : null,
                notes: `Initial stock for variant: ${variant.slug}`,
                lastUpdatedBy: staffMember ? staffMember._id : null
              });
            }
          }
        } else {
          stockEntries.push({
            productId: product._id,
            variantId: null,
            quantity: product.baseStock !== undefined ? product.baseStock : null,
            minStock: product.minStock !== undefined ? product.minStock : null,
            notes: "Initial stock from product creation",
            lastUpdatedBy: staffMember ? staffMember._id : null
          });
        }
      }

      if (stockEntries.length > 0) {
        await Stock.insertMany(stockEntries);
        console.log(`✅ Created ${stockEntries.length} stock entries`);
      }
    } catch (stockError) {
      console.error('❌ Error creating stock entries:', stockError);
    }

    res.status(201).json({ success: true, data: product.toObject() });
  } catch (err) {
    console.error("Create product error:", err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      let errorMessage = 'A duplicate value was detected.';
      if (field === 'sku') errorMessage = 'This SKU is already in use. Please choose a different SKU.';
      else if (field === 'slug') errorMessage = 'This product name would create a duplicate URL slug. Please choose a different name.';
      else if (field === 'variants.sku') errorMessage = 'One of the variant SKUs is already in use. Please ensure all variant SKUs are unique.';
      return res.status(400).json({ success: false, error: errorMessage, field });
    }

    if (err.message && err.message.includes('Duplicate variant SKUs')) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate variant SKUs detected within the product. Each variant must have a unique SKU.',
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create product",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// PUT update a product
router.put("/:id", uploadDigitalFile, async (req, res) => {

  console.log('🔥 RAW BODY KEYS:', Object.keys(req.body).filter(k => k.includes('Variant') || k.includes('variant')));
console.log('🔥 SAMPLE existingVariantImages key exists:', 'existingVariantImages[0][0]' in req.body);

  try {
    console.log('=== PUT PRODUCT DEBUG ===');

    // ─── Parse categories ──────────────────────────────────────────
    let categories = [];
    let categoriesParsed = false;
    if (req.body.categories) {
      try {
        const parsedCategories = JSON.parse(req.body.categories);
        categoriesParsed = true;
        if (Array.isArray(parsedCategories)) {
          for (const cat of parsedCategories) {
            let categoryId = null;
            if (cat.categoryId) {
              if (typeof cat.categoryId === 'string' && cat.categoryId.length === 24 && /^[a-fA-F0-9]{24}$/.test(cat.categoryId)) {
                categoryId = cat.categoryId;
              }
            } else if (cat.category) {
              if (typeof cat.category === 'string' && cat.category.length === 24 && /^[a-fA-F0-9]{24}$/.test(cat.category)) {
                categoryId = cat.category;
              } else if (typeof cat.category === 'string') {
                try {
                  const Category = require("../models/Category.js");
                  const foundCategory = await Category.findOne({ $or: [{ slug: cat.category }, { name: cat.category }] });
                  if (foundCategory) categoryId = foundCategory._id.toString();
                  else continue;
                } catch (categoryError) {
                  console.error("Error finding category:", categoryError);
                  continue;
                }
              } else if (cat.category._id || cat.category.id) {
                categoryId = cat.category._id || cat.category.id;
              }
            }

            if (categoryId) {
              let subcategories = [];
              if (cat.subcategoryIds && Array.isArray(cat.subcategoryIds)) {
                for (const subcatId of cat.subcategoryIds) {
                  if (typeof subcatId === 'string' && subcatId.length === 24 && /^[a-fA-F0-9]{24}$/.test(subcatId)) {
                    subcategories.push(subcatId);
                  }
                }
              } else if (cat.subcategories && Array.isArray(cat.subcategories)) {
                for (const subcat of cat.subcategories) {
                  if (typeof subcat === 'string' && subcat.length === 24 && /^[a-fA-F0-9]{24}$/.test(subcat)) {
                    subcategories.push(subcat);
                  } else if (typeof subcat === 'string') {
                    try {
                      const Subcategory = require("../models/Subcategory.js");
                      const foundSubcategory = await Subcategory.findOne({ $or: [{ slug: subcat }, { name: subcat }] });
                      if (foundSubcategory) subcategories.push(foundSubcategory._id.toString());
                    } catch (subcategoryError) {
                      console.error("Error finding subcategory:", subcategoryError);
                    }
                  }
                }
              }
              categories.push({ category: categoryId, subcategories });
            }
          }
        }
      } catch (e) {
        console.error("Error parsing categories JSON:", e);
        categoriesParsed = false;
      }
    }

    // ─── Parse tags ────────────────────────────────────────────────
    let tags = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch (e) {
        tags = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
      }
    }

    // ─── Parse SEO keywords ────────────────────────────────────────
    let seoKeywords = [];
    if (req.body.seo_keywords) {
      try {
        seoKeywords = JSON.parse(req.body.seo_keywords);
      } catch (e) {
        console.error("Error parsing seoKeywords JSON:", e);
      }
    }

    // ─── Parse variants ────────────────────────────────────────────
    let variantsData = null;
    if (req.body.product_variants) {
      try {
        variantsData = JSON.parse(req.body.product_variants);
      } catch (e) {
        console.error("Error parsing variants JSON:", e);
      }
    }

    const productType = req.body.product_type || 'physical';
    const productStructure = req.body.product_structure || req.body.productStructure;

    // ─── Find current product ──────────────────────────────────────
    let productQuery = {};
    try {
      if (req.params.id && req.params.id.length === 24 && /^[a-fA-F0-9]{24}$/.test(req.params.id)) {
        productQuery._id = new mongoose.Types.ObjectId(req.params.id);
      } else {
        productQuery._id = req.params.id;
      }
    } catch (err) {
      productQuery._id = req.params.id;
    }

    const currentProduct = await Product.findOne(productQuery);
    if (!currentProduct) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 1: Process uploaded files
    // ─────────────────────────────────────────────────────────────────
    let newImageUrls = [];
    let digitalFile = null;
    const newVariantImagePaths = {};

    if (req.files && Array.isArray(req.files)) {
      const filesByField = {};
      req.files.forEach(file => {
        if (!filesByField[file.fieldname]) filesByField[file.fieldname] = [];
        filesByField[file.fieldname].push(file);
      });

      // Main product images
      const imageFields = Object.keys(filesByField).filter(key =>
        key.startsWith('images[') || key === 'images'
      );
      imageFields.forEach(key => {
        filesByField[key].forEach(file => {
          newImageUrls.push(`/uploads/products/${file.filename}`);
        });
      });

      // Variant image files
      const variantImageFields = Object.keys(filesByField).filter(key =>
        key.startsWith('variantImages[')
      );
      variantImageFields.forEach(key => {
        const match = key.match(/variantImages\[(\d+)\]\[(\d+)\]/);
        if (!match) return;
        const comboIdx = parseInt(match[1]);
        if (!newVariantImagePaths[comboIdx]) newVariantImagePaths[comboIdx] = [];
        filesByField[key].forEach(file => {
          newVariantImagePaths[comboIdx].push(`/uploads/products/${file.filename}`);
          console.log(`✅ PUT: New file saved for variant ${comboIdx}: ${file.filename}`);
        });
      });

      if (filesByField.fileUpload && filesByField.fileUpload.length > 0) {
        digitalFile = filesByField.fileUpload[0];
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // FIX 1: Determine final main product image URLs
    // - If new images uploaded → use them (replace old ones)
    // - If no new images → preserve existing images from DB
    // ─────────────────────────────────────────────────────────────────
    let allImageUrls = [];

// Always start with existing URLs the client wants to keep
let preservedUrls = [];
if (req.body.image_url) {
  try {
    const provided = typeof req.body.image_url === 'string'
      ? JSON.parse(req.body.image_url)
      : req.body.image_url;
    if (Array.isArray(provided)) {
      preservedUrls = provided;
    }
  } catch (error) {
    console.error('❌ Failed to parse image_url payload:', error);
  }
}

if (newImageUrls.length > 0) {
  // New images uploaded — merge: keep existing preserved URLs + add new ones
  allImageUrls = [...preservedUrls, ...newImageUrls];
  console.log(`✅ Merged: ${preservedUrls.length} existing + ${newImageUrls.length} new = ${allImageUrls.length} total`);
} else if (preservedUrls.length > 0) {
  // No new uploads — use what client sent
  allImageUrls = preservedUrls;
  console.log(`✅ Preserving ${preservedUrls.length} client-provided image URL(s)`);
} else {
  // Final fallback — preserve DB images
  allImageUrls = currentProduct.image_url || [];
  console.log(`✅ Falling back to ${allImageUrls.length} existing DB image(s)`);
}

    // ─────────────────────────────────────────────────────────────────
    // STEP 2: Read existingVariantImages sent from admin (URLs to keep)
    // ─────────────────────────────────────────────────────────────────
   const existingVariantImageUrls = {};
if (req.body.existingVariantImages && typeof req.body.existingVariantImages === 'object') {
  Object.entries(req.body.existingVariantImages).forEach(([comboIdx, urlMap]) => {
    if (typeof urlMap === 'object') {
      existingVariantImageUrls[parseInt(comboIdx)] = Object.values(urlMap);
    }
  });
}

    console.log('✅ PUT: Existing variant URLs to preserve:',
      Object.entries(existingVariantImageUrls).map(([k, v]) => `variant ${k}: ${v.length} URLs`)
    );
    console.log('✅ PUT: New variant files uploaded:',
      Object.entries(newVariantImagePaths).map(([k, v]) => `variant ${k}: ${v.length} files`)
    );

    // ─────────────────────────────────────────────────────────────────
    // FIX 2: Merge variant images — existing URLs + new files + DB fallback
    // ─────────────────────────────────────────────────────────────────
    if (variantsData?.combinations) {
      variantsData.combinations = variantsData.combinations.map((combo, idx) => {
        const existing = existingVariantImageUrls[idx] || [];
        const newFiles = newVariantImagePaths[idx] || [];

        let merged = [...existing, ...newFiles];

        // If nothing was provided at all for this variant, fall back to DB images
        if (merged.length === 0) {
          const dbVariant = currentProduct.product_variants?.[idx];
          if (dbVariant?.images?.length > 0) {
            merged = [...dbVariant.images];
            console.log(`✅ Variant ${idx} (${combo.name}): falling back to ${merged.length} DB image(s)`);
          }
        } else {
          console.log(`✅ Variant ${idx} (${combo.name}): ${existing.length} existing + ${newFiles.length} new = ${merged.length} total`);
        }

        return { ...combo, images: merged };
      });
    }

    // ─── Build update data ─────────────────────────────────────────
    const updateData = { updated_at: new Date() };

    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.slug !== undefined) updateData.slug = req.body.slug;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (productStructure) updateData.product_structure = productStructure;
    if (req.body.sku) updateData.sku = req.body.sku.toUpperCase();
    if (categoriesParsed) updateData.categories = categories;
    if (req.body.tax_percentage !== undefined) {
  updateData.tax_percentage = parseFloat(req.body.tax_percentage);
}

    if (productStructure === 'simple') {
      if (req.body.cost_price || req.body.costPrice) updateData.cost_price = parseFloat(req.body.cost_price || req.body.costPrice);
      if (req.body.selling_price || req.body.salesPrice) updateData.selling_price = parseFloat(req.body.selling_price || req.body.salesPrice);
    } else if (productStructure === 'variant') {
      updateData.cost_price = undefined;
      updateData.selling_price = undefined;
    }

    if (productType === 'physical') {
      const hasStockUpdate = req.body.stock !== undefined;
      const hasMinStockUpdate = req.body.min_stock_threshold !== undefined;
      if (hasStockUpdate) updateData.baseStock = parseInt(req.body.stock);
      if (hasMinStockUpdate) updateData.minStock = parseInt(req.body.min_stock_threshold);

      const isSimpleStructure = (productStructure || currentProduct?.product_structure) === 'simple';
      if (isSimpleStructure && (hasStockUpdate || hasMinStockUpdate)) {
        const effectiveBaseStock = hasStockUpdate ? updateData.baseStock : currentProduct?.baseStock;
        const effectiveMinStock = hasMinStockUpdate ? updateData.minStock : currentProduct?.minStock;
        if (typeof effectiveBaseStock === 'number') {
          if (effectiveBaseStock > (typeof effectiveMinStock === 'number' ? effectiveMinStock : 0)) {
            updateData.status = 'selling';
          } else if (effectiveBaseStock > 0) {
            updateData.status = 'low_stock';
          } else {
            updateData.status = 'out_of_stock';
          }
        }
      }
    } else if (productType === 'digital') {
      updateData.baseStock = 0;
      updateData.minStock = 0;
      updateData.status = 'selling';
      updateData.product_structure = 'simple';
    }

    // FIX 1 applied here — always set image_url (never skip it)
    updateData.image_url = allImageUrls;

    if (tags.length > 0) updateData.tags = tags;

    if (req.body.weight !== undefined) updateData.weight = parseFloat(req.body.weight);
    if (req.body.color !== undefined) updateData.color = req.body.color;
    if (req.body.size !== undefined) updateData.size = req.body.size;
    if (req.body.material !== undefined) updateData.material = req.body.material;
    if (req.body.brand !== undefined) updateData.brand = req.body.brand;
    if (req.body.warranty !== undefined) updateData.warranty = req.body.warranty;

    if (productType === 'digital') {
      if (digitalFile) {
        updateData.file_path = `/uploads/products/${digitalFile.filename}`;
        updateData.file_size = digitalFile.size;
      }
      if (req.body.download_format !== undefined) updateData.download_format = req.body.download_format;
      if (req.body.license_type !== undefined) updateData.license_type = req.body.license_type;
      if (req.body.download_limit !== undefined) updateData.download_limit = parseInt(req.body.download_limit);
    }

    // ─── SEO fields ────────────────────────────────────────────────
    if (
      req.body.seo_title !== undefined || req.body.seo_description !== undefined ||
      seoKeywords.length > 0 || req.body.seo_canonical !== undefined ||
      req.body.seo_robots !== undefined || req.body.seo_og_title !== undefined ||
      req.body.seo_og_description !== undefined || req.body.seo_og_image !== undefined
    ) {
      updateData.seo = {};
      if (req.body.seo_title?.trim()) updateData.seo.title = req.body.seo_title;
      if (req.body.seo_description?.trim()) updateData.seo.description = req.body.seo_description;
      if (seoKeywords?.length > 0) updateData.seo.keywords = seoKeywords;
      if (req.body.seo_canonical?.trim()) updateData.seo.canonical = req.body.seo_canonical;
      if (req.body.seo_robots) updateData.seo.robots = req.body.seo_robots;
      if (req.body.seo_og_title?.trim()) updateData.seo.ogTitle = req.body.seo_og_title;
      if (req.body.seo_og_description?.trim()) updateData.seo.ogDescription = req.body.seo_og_description;
      if (req.body.seo_og_image?.trim()) updateData.seo.ogImage = req.body.seo_og_image;
    }

    // ─── Transform and save variants ───────────────────────────────
    if (variantsData?.combinations?.length > 0) {
      const transformedVariants = transformVariantsForDB(
        variantsData,
        req.body.sku || 'PROD',
        updateData.cost_price,
        updateData.selling_price,
        {} // images already merged onto combinations in FIX 2
      );

      console.log('=== Transformed variants ===');
      transformedVariants.forEach((v, i) => {
        console.log(`  Variant ${i} (${v.name}): ${v.images?.length || 0} images → ${JSON.stringify(v.images)}`);
      });

      if (transformedVariants.length > 0) {
        updateData.product_variants = transformedVariants;
      }
    }

    // ─── Handle published status toggle ───────────────────────────
    if (req.body.published !== undefined && productStructure !== 'variant') {
      const isPublishing = req.body.published === 'true';
      const currentPublished = currentProduct.published || false;

      if (isPublishing !== currentPublished) {
        const productForValidation = {
          ...currentProduct.toObject(),
          ...updateData,
          product_variants: updateData.product_variants || currentProduct.product_variants,
          product_type: updateData.product_type || currentProduct.product_type,
          product_structure: updateData.product_structure || currentProduct.product_structure
        };

        const stockValidation = validateStockForPublish(productForValidation, isPublishing);

        if (!stockValidation.canPublish) {
          return res.status(400).json({
            success: false,
            error: stockValidation.message,
            requiresStock: true,
            stockInfo: stockValidation.stockInfo,
            isZeroStock: (stockValidation.stockInfo?.baseStock ?? currentProduct.baseStock ?? 0) === 0
          });
        }

        updateData.published = stockValidation.published;
        updateData.status = stockValidation.status;
        updateData._stockValidation = {
          message: stockValidation.message,
          stockInfo: stockValidation.stockInfo,
          requiredAction: isPublishing ? 'publish' : 'archive'
        };
      } else {
        updateData.published = req.body.published === 'true';
      }
    }

    if (!updateData.product_nature && currentProduct.product_nature) updateData.product_nature = currentProduct.product_nature;
    if (!updateData.product_structure && currentProduct.product_structure) updateData.product_structure = currentProduct.product_structure;

    // ─── Save to DB ────────────────────────────────────────────────
const product = await Product.findOneAndUpdate(
  productQuery,
  { $set: updateData },  // ← use $set explicitly
  { new: true, runValidators: false, context: 'query' }
);

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    console.log('=== AFTER UPDATE ===');
    console.log(`Main images saved: ${product.image_url?.length || 0} → ${JSON.stringify(product.image_url)}`);
    product.product_variants?.forEach((v, i) => {
      console.log(`Variant ${i} (${v.name}) images saved: ${v.images?.length || 0} → ${JSON.stringify(v.images)}`);
    });

    // ─── Update stock entries ──────────────────────────────────────
    try {
      let staffMember;
      try {
        const Staff = require("../models/Staff.js");
        staffMember = await Staff.findOne({ is_active: true }).sort({ created_at: 1 });
      } catch (staffError) {
        console.error('Error finding staff member:', staffError);
      }

      if (product.product_structure === 'simple' && (product.baseStock !== undefined || product.minStock !== undefined)) {
        await Stock.findOneAndUpdate(
          { productId: product._id, variantId: null },
          {
            quantity: product.baseStock !== undefined ? product.baseStock : null,
            minStock: product.minStock !== undefined ? product.minStock : null,
            lastUpdatedBy: staffMember ? staffMember._id : null,
            updated_at: new Date()
          },
          { upsert: true, new: true }
        );
      }

      if (product.product_variants?.length > 0) {
        const currentVariantIds = product.product_variants.map(v => v._id.toString());
        const existingStockEntries = await Stock.find({ productId: product._id, variantId: { $ne: null } });

        const stockEntriesToDelete = existingStockEntries.filter(
          e => !currentVariantIds.includes(e.variantId.toString())
        );
        if (stockEntriesToDelete.length > 0) {
          await Stock.deleteMany({ _id: { $in: stockEntriesToDelete.map(s => s._id) } });
        }

        for (const variant of product.product_variants) {
          if (variant.stock !== undefined || variant.minStock !== undefined) {
            const existingEntry = existingStockEntries.find(
              e => e.variantId.toString() === variant._id.toString()
            );
            const stockPayload = {
              productId: product._id,
              variantId: variant._id,
              quantity: variant.stock !== undefined ? variant.stock : 0,
              minStock: variant.minStock !== undefined ? variant.minStock : 0,
              lastUpdatedBy: staffMember ? staffMember._id : null,
              updated_at: new Date()
            };
            if (existingEntry) {
              await Stock.findByIdAndUpdate(existingEntry._id, stockPayload);
            } else {
              await Stock.create(stockPayload);
            }
          }
        }
      }
    } catch (stockError) {
      console.error('❌ Error updating stock entries:', stockError);
    }

    res.json({ success: true, data: product });

  } catch (err) {
    console.error("Update product error:", err);

    if (err.message?.includes('Duplicate variant SKUs')) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate variant SKUs detected. Each variant must have a unique SKU.',
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update product",
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack,
        name: err.name
      })
    });
  }
});

// DELETE a product by id
router.delete("/:id", async (req, res) => {
  try {
    let productQuery = {};
    try {
      if (req.params.id && req.params.id.length === 24 && /^[a-fA-F0-9]{24}$/.test(req.params.id)) {
        productQuery._id = new mongoose.Types.ObjectId(req.params.id);
      } else {
        productQuery._id = req.params.id;
      }
    } catch (err) {
      productQuery._id = req.params.id;
    }

    const product = await Product.findOne(productQuery);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const mainImageFileNames = product.image_url?.map(url => url.split("/").pop()).filter(Boolean) ?? [];
    for (const imageFileName of mainImageFileNames) {
      const imagePath = path.join(uploadDir, imageFileName);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('✅ Deleted main product image:', imageFileName);
      }
    }

    if (product.product_variants && product.product_variants.length > 0) {
      for (const variant of product.product_variants) {
        if (variant.images && variant.images.length > 0) {
          for (const imageUrl of variant.images) {
            if (imageUrl) {
              const imageFileName = imageUrl.split("/").pop();
              const imagePath = path.join(uploadDir, imageFileName);
              if (fs.existsSync(imagePath)) {
                try {
                  fs.unlinkSync(imagePath);
                  console.log('✅ Deleted variant image:', imageFileName);
                } catch (deleteError) {
                  console.error(`❌ Failed to delete variant image ${imageFileName}:`, deleteError.message);
                }
              }
            }
          }
        }
      }
    }

    if (product.product_type === 'digital' && product.file_path) {
      const digitalFileName = `products/${product.file_path.split("/").pop()}`;
      const digitalFilePath = path.join(uploadDir, digitalFileName);
      if (fs.existsSync(digitalFilePath)) {
        fs.unlinkSync(digitalFilePath);
      }
    }

    try {
      const deletedStocks = await Stock.deleteMany({ productId: product._id });
      console.log(`✅ Deleted ${deletedStocks.deletedCount} stock entries`);
    } catch (stockError) {
      console.error('❌ Error deleting stock entries:', stockError);
    }

    const deletedProduct = await Product.findOneAndDelete(productQuery);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product and all associated files deleted successfully",
      data: deletedProduct
    });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete product",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// BULK delete products
router.delete("/bulk", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ success: false, error: "No product IDs provided" });

    const objectIds = ids.map(id => {
      try {
        if (id && id.length === 24 && /^[a-fA-F0-9]{24}$/.test(id)) return new mongoose.Types.ObjectId(id);
        return id;
      } catch { return null; }
    }).filter(Boolean);

    if (objectIds.length === 0)
      return res.status(400).json({ success: false, error: "No valid IDs provided" });

    const productsToDelete = await Product.find({ _id: { $in: objectIds } });

    for (const product of productsToDelete) {
      const mainImageFileNames = product.image_url?.map(url => url.split("/").pop()).filter(Boolean) ?? [];
      for (const imageFileName of mainImageFileNames) {
        const imagePath = path.join(uploadDir, imageFileName);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      if (product.product_variants && product.product_variants.length > 0) {
        for (const variant of product.product_variants) {
          if (variant.images && variant.images.length > 0) {
            for (const imageUrl of variant.images) {
              if (imageUrl) {
                const imageFileName = imageUrl.split("/").pop();
                const imagePath = path.join(uploadDir, imageFileName);
                if (fs.existsSync(imagePath)) {
                  try { fs.unlinkSync(imagePath); } catch (e) { console.error(e.message); }
                }
              }
            }
          }
        }
      }

      if (product.product_type === 'digital' && product.file_path) {
        const digitalFileName = `products/${product.file_path.split("/").pop()}`;
        const digitalFilePath = path.join(uploadDir, digitalFileName);
        if (fs.existsSync(digitalFilePath)) fs.unlinkSync(digitalFilePath);
      }
    }

    try {
      const deletedStocks = await Stock.deleteMany({ productId: { $in: objectIds } });
      console.log(`✅ Bulk deleted ${deletedStocks.deletedCount} stock entries`);
    } catch (stockError) {
      console.error('❌ Error deleting stock entries in bulk:', stockError);
    }

    const result = await Product.deleteMany({ _id: { $in: objectIds } });

    res.json({
      success: true,
      message: `${result.deletedCount} products and all associated files deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Bulk delete products error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete products",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// PATCH toggle product published status
router.patch("/toggle-status", async (req, res) => {
  try {
    const { id, variantId, published } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, error: "Product ID is required" });
    }

    const currentProduct = await Product.findById(id);
    if (!currentProduct) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    if (currentProduct.product_structure === 'variant' && variantId) {
      const variantIndex = currentProduct.product_variants.findIndex(
        v => v._id.toString() === variantId
      );

      if (variantIndex === -1) {
        return res.status(404).json({ success: false, error: "Variant not found" });
      }

      currentProduct.product_variants[variantIndex].published = published;

      const variant = currentProduct.product_variants[variantIndex];
      if (published) {
        if (variant.stock !== undefined && variant.minStock !== undefined) {
          variant.status = variant.stock > variant.minStock ? 'selling' : 'out_of_stock';
        } else {
          variant.status = 'draft';
        }
      } else {
        variant.status = 'archived';
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          'product_variants': currentProduct.product_variants,
          $unset: { status: "", published: "" }
        },
        { new: true }
      );

      return res.json({
        success: true,
        data: updatedProduct,
        message: published ? `Variant published ` : 'Variant unpublished'
      });
    }

    const updateData = {
      published,
      product_nature: currentProduct.product_nature,
      product_structure: currentProduct.product_structure
    };

    if (published) {
      const baseStock = typeof currentProduct.baseStock === 'number' ? currentProduct.baseStock : 0;
      const minStock = typeof currentProduct.minStock === 'number' ? currentProduct.minStock : 0;
      const hasStock = baseStock > 0 && baseStock > minStock;
      updateData.status = hasStock ? 'selling' : 'out_of_stock';
      updateData['seo.robots'] = hasStock ? 'index,follow' : 'noindex,follow';
    } else {
      updateData.status = 'archived';
      updateData['seo.robots'] = 'noindex,nofollow';
    }

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });

    res.json({
      success: true,
      data: product,
      message: published
        ? `Product ${updateData.status === 'out_of_stock' ? 'published but out of stock' : 'published successfully'} `
        : 'Product archived'
    });
  } catch (err) {
    console.error("Toggle product status error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to toggle product status",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET all ratings for a product
router.get("/:id/ratings", async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const productId = req.params.id;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let sortQuery = {};
    if (sort === 'newest') sortQuery = { created_at: -1 };
    else if (sort === 'oldest') sortQuery = { created_at: 1 };
    else if (sort === 'highest') sortQuery = { rating: -1 };
    else if (sort === 'lowest') sortQuery = { rating: 1 };

    const Rating = require("../models/Rating");
    const Customer = require("../models/Customer");

    const ratings = await Rating.find({
      product_id: new mongoose.Types.ObjectId(productId),
      status: 'approved'
    })
      .populate({ path: 'customer_id', model: Customer, select: 'name email' })
      .sort(sortQuery)
      .skip(skip)
      .limit(limitNum);

    const total = await Rating.countDocuments({
      product_id: new mongoose.Types.ObjectId(productId),
      status: 'approved'
    });

    const ratingStats = await Rating.aggregate([
      { $match: { product_id: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          ratingDistribution: { $push: '$rating' }
        }
      }
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalRatings: 0, ratingDistribution: [] };
    const distribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: stats.ratingDistribution.filter(r => r === rating).length
    }));

    res.json({
      success: true,
      data: ratings,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      },
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalRatings: stats.totalRatings,
        distribution
      }
    });
  } catch (err) {
    console.error("Error fetching ratings:", err);
    res.status(500).json({ success: false, error: "Failed to fetch ratings" });
  }
});

// POST a new rating
router.post("/:id/ratings", async (req, res) => {
  try {
    const { customer_id, rating, review } = req.body;
    const productId = req.params.id;

    if (!customer_id || !rating) {
      return res.status(400).json({ success: false, error: "Customer ID and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: "Rating must be between 1 and 5" });
    }

    const Customer = require("../models/Customer");
    const customer = await Customer.findOne({ firebase_uid: customer_id });
    if (!customer) return res.status(404).json({ success: false, error: "Customer not found" });

    const Rating = require("../models/Rating");
    const existingRating = await Rating.findOne({
      customer_id: customer._id,
      product_id: new mongoose.Types.ObjectId(productId)
    });
    if (existingRating) return res.status(400).json({ success: false, error: "You have already rated this product" });

    const Order = require("../models/Order");
    const hasPurchased = await Order.findOne({
      customer_id: customer._id,
      status: { $in: ['processing', 'shipped', 'delivered'] },
      'items.product_id': new mongoose.Types.ObjectId(productId)
    });

    if (!hasPurchased) {
      return res.status(403).json({ success: false, error: "You can only rate products you have purchased" });
    }

    const newRating = new Rating({
      customer_id: customer._id,
      product_id: new mongoose.Types.ObjectId(productId),
      rating: parseInt(rating),
      review: review || '',
      verified_purchase: !!hasPurchased,
      status: 'approved'
    });
    await newRating.save();

    const ratingStats = await Rating.aggregate([
      { $match: { product_id: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          totalReviews: { $sum: { $cond: [{ $ne: ['$review', null] }, 1, 0] } }
        }
      }
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalRatings: 0, totalReviews: 0 };
    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(stats.averageRating * 10) / 10,
      totalRatings: stats.totalRatings,
      totalReviews: stats.totalReviews
    });

    res.status(201).json({ success: true, message: "Rating submitted successfully", data: newRating });
  } catch (err) {
    console.error("Error submitting rating:", err);
    res.status(500).json({ success: false, error: "Failed to submit rating" });
  }
});

// GET customer's rating for a product
router.get("/:id/ratings/customer/:customerId", async (req, res) => {
  try {
    const { id: productId, customerId } = req.params;
    const Customer = require("../models/Customer");
    const customer = await Customer.findOne({ firebase_uid: customerId });
    if (!customer) return res.json({ success: true, data: null });

    const Rating = require("../models/Rating");
    const rating = await Rating.findOne({
      customer_id: customer._id,
      product_id: new mongoose.Types.ObjectId(productId)
    });

    res.json({ success: true, data: rating });
  } catch (err) {
    console.error("Error fetching customer rating:", err);
    res.status(500).json({ success: false, error: "Failed to fetch rating" });
  }
});

// PUT update a rating
router.put("/:id/ratings", async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { customer_id, rating, review } = req.body;

    if (!customer_id || !rating) {
      return res.status(400).json({ success: false, error: "Customer ID and rating are required" });
    }

    const Customer = require("../models/Customer");
    let customerQuery = { firebase_uid: customer_id };
    if (mongoose.Types.ObjectId.isValid(customer_id)) {
      customerQuery = { $or: [{ firebase_uid: customer_id }, { _id: customer_id }] };
    }
    const customer = await Customer.findOne(customerQuery);
    if (!customer) return res.status(404).json({ success: false, error: "Customer not found" });

    const Rating = require("../models/Rating");
    const existingRating = await Rating.findOne({ customer_id: customer._id, product_id: productId });
    if (!existingRating) return res.status(404).json({ success: false, error: "Rating not found" });

    existingRating.rating = rating;
    existingRating.review = review || existingRating.review;
    await existingRating.save();

    const ratingStats = await Rating.aggregate([
      { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$product_id',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          totalReviews: { $sum: { $cond: [{ $ifNull: ['$review', false] }, 1, 0] } }
        }
      }
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalRatings: 0, totalReviews: 0 };
    await Product.findByIdAndUpdate(productId, {
      averageRating: stats.averageRating,
      totalRatings: stats.totalRatings,
      totalReviews: stats.totalReviews
    });

    res.json({ success: true, data: existingRating, message: "Review updated successfully" });
  } catch (err) {
    console.error("Error updating rating:", err);
    res.status(500).json({ success: false, error: "Failed to update rating" });
  }
});

// DELETE a rating
router.delete("/:id/ratings", async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { customer_id } = req.query;

    if (!customer_id) return res.status(400).json({ success: false, error: "Customer ID is required" });

    const Customer = require("../models/Customer");
    let customerQuery = { firebase_uid: customer_id };
    if (mongoose.Types.ObjectId.isValid(customer_id)) {
      customerQuery = { $or: [{ firebase_uid: customer_id }, { _id: customer_id }] };
    }
    const customer = await Customer.findOne(customerQuery);
    if (!customer) return res.status(404).json({ success: false, error: "Customer not found" });

    const Rating = require("../models/Rating");
    const result = await Rating.findOneAndDelete({ customer_id: customer._id, product_id: productId });
    if (!result) return res.status(404).json({ success: false, error: "Rating not found" });

    const ratingStats = await Rating.aggregate([
      { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$product_id',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          totalReviews: { $sum: { $cond: [{ $ifNull: ['$review', false] }, 1, 0] } }
        }
      }
    ]);

    const stats = ratingStats[0] || { averageRating: 0, totalRatings: 0, totalReviews: 0 };
    await Product.findByIdAndUpdate(productId, {
      averageRating: stats.averageRating,
      totalRatings: stats.totalRatings,
      totalReviews: stats.totalReviews
    });

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    console.error("Error deleting rating:", err);
    res.status(500).json({ success: false, error: "Failed to delete rating" });
  }
});

module.exports = router;