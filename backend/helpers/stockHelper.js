const Product = require('../models/Product');
const Stock = require('../models/Stock');

/**
 * Deducts stock for all items in an order.
 * Call this immediately after a successful order placement or payment verification.
 *
 * @param {Array} items - Array of order items: [{ product_id, variant_id, quantity }]
 * @param {String} invoiceNo - Invoice number for notes/tracking
 */
async function deductStockForOrder(items, invoiceNo) {
  console.log(`=== DEDUCTING STOCK FOR ORDER: ${invoiceNo} ===`);

  for (const item of items) {
    try {
      const productId = item.product_id;
      const variantId = item.variant_id || null;
      const qty = item.quantity;

      if (!productId || !qty) {
        console.warn(`Skipping item — missing productId or quantity:`, item);
        continue;
      }

      console.log(`Processing: productId=${productId}, variantId=${variantId}, qty=${qty}`);

      // ── 1. Update the Stock collection ──────────────────────────────
      const stockEntry = await Stock.findOne({
        productId,
        variantId: variantId || null,
      });

      if (!stockEntry) {
        console.warn(`No stock entry found for product ${productId}, variant ${variantId}`);
        // Still try to update the Product directly
        await updateProductStockDirectly(productId, variantId, qty, invoiceNo);
        continue;
      }

      const previousQty = stockEntry.quantity;
      stockEntry.quantity = Math.max(0, previousQty - qty);
      stockEntry.notes = `Deducted ${qty} unit(s) via order ${invoiceNo}. Was: ${previousQty}, Now: ${stockEntry.quantity}`;
      stockEntry.updated_at = new Date();
      await stockEntry.save();

      console.log(`✅ Stock entry updated: ${previousQty} → ${stockEntry.quantity}`);

      // ── 2. Sync Product fields to match ─────────────────────────────
      const product = await Product.findById(productId);
      if (!product) {
        console.warn(`Product not found: ${productId}`);
        continue;
      }

      // Digital products don't need stock updates
      if (product.product_type === 'digital') {
        console.log(`Skipping digital product: ${productId}`);
        continue;
      }

      if (variantId) {
        // ── Variant product ──────────────────────────────────────────
        const vIdx = product.product_variants.findIndex(
          (v) => v._id.toString() === variantId.toString()
        );

        if (vIdx === -1) {
          console.warn(`Variant ${variantId} not found in product ${productId}`);
          continue;
        }

        const newVariantStock = stockEntry.quantity;
        const variantMinStock = stockEntry.minStock || product.product_variants[vIdx].minStock || 5;

        product.product_variants[vIdx].stock = newVariantStock;
        product.product_variants[vIdx].status =
          newVariantStock <= 0 ? 'out_of_stock' :
          newVariantStock <= variantMinStock ? 'low_stock' : 'selling';

        await product.save();

        // Update overall product status based on all variants
        await updateProductStatusFromVariants(product);

        console.log(`✅ Variant ${variantId} stock updated to ${newVariantStock}, status: ${product.product_variants[vIdx].status}`);

      } else {
        // ── Simple/base product ──────────────────────────────────────
        const newBaseStock = stockEntry.quantity;
        const productMinStock = stockEntry.minStock || product.minStock || 5;

        product.baseStock = newBaseStock;
        product.status =
          newBaseStock <= 0 ? 'out_of_stock' :
          newBaseStock <= productMinStock ? 'low_stock' : 'selling';

        await product.save();

        console.log(`✅ Base product stock updated to ${newBaseStock}, status: ${product.status}`);
      }

    } catch (err) {
      // Don't throw — log and continue with remaining items
      console.error(`❌ Error deducting stock for item:`, item, err.message);
    }
  }

  console.log(`=== STOCK DEDUCTION COMPLETE FOR ORDER: ${invoiceNo} ===`);
}


/**
 * Fallback: directly update Product stock fields when no Stock entry exists.
 */
async function updateProductStockDirectly(productId, variantId, qty, invoiceNo) {
  try {
    const product = await Product.findById(productId);
    if (!product || product.product_type === 'digital') return;

    if (variantId) {
      const vIdx = product.product_variants.findIndex(
        (v) => v._id.toString() === variantId.toString()
      );
      if (vIdx === -1) return;

      const currentStock = product.product_variants[vIdx].stock || 0;
      const newStock = Math.max(0, currentStock - qty);
      const minStock = product.product_variants[vIdx].minStock || 5;

      product.product_variants[vIdx].stock = newStock;
      product.product_variants[vIdx].status =
        newStock <= 0 ? 'out_of_stock' :
        newStock <= minStock ? 'low_stock' : 'selling';

      await product.save();
      await updateProductStatusFromVariants(product);

      console.log(`✅ (Direct) Variant stock updated: ${currentStock} → ${newStock}`);
    } else {
      const currentStock = product.baseStock || 0;
      const newStock = Math.max(0, currentStock - qty);
      const minStock = product.minStock || 5;

      product.baseStock = newStock;
      product.status =
        newStock <= 0 ? 'out_of_stock' :
        newStock <= minStock ? 'low_stock' : 'selling';

      await product.save();

      console.log(`✅ (Direct) Base stock updated: ${currentStock} → ${newStock}`);
    }
  } catch (err) {
    console.error(`❌ Error in updateProductStockDirectly:`, err.message);
  }
}


/**
 * Updates the overall product status based on the state of all its variants.
 */
async function updateProductStatusFromVariants(product) {
  try {
    if (
      product.product_structure !== 'variant' ||
      !product.product_variants ||
      product.product_variants.length === 0
    ) return;

    // Re-fetch to get latest variant state
    const freshProduct = await Product.findById(product._id);
    if (!freshProduct) return;

    const variants = freshProduct.product_variants;
    const sellingVariants = variants.filter(v => v.published && v.status === 'selling');
    const lowStockVariants = variants.filter(v => v.published && v.status === 'low_stock');
    const outOfStockVariants = variants.filter(v => v.status === 'out_of_stock');

    let newStatus;
    if (sellingVariants.length > 0) {
      newStatus = 'selling';
    } else if (lowStockVariants.length > 0) {
      newStatus = 'low_stock';
    } else if (outOfStockVariants.length === variants.length) {
      newStatus = 'out_of_stock';
    } else {
      newStatus = 'draft';
    }

    if (newStatus !== freshProduct.status) {
      await Product.findByIdAndUpdate(product._id, { status: newStatus });
      console.log(`✅ Product ${product._id} overall status updated to: ${newStatus}`);
    }
  } catch (err) {
    console.error(`❌ Error updating product status from variants:`, err.message);
  }
}


module.exports = { deductStockForOrder };