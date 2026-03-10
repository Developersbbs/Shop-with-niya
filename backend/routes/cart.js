const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Stock = require('../models/Stock');
const { authenticateToken } = require('../middleware/auth');
const { authenticateHybridToken } = require('../middleware/hybridAuth');

// ✅ Single populate string used everywhere - includes tax_percentage, product_variants, baseStock
const PRODUCT_POPULATE_FIELDS = 'name slug selling_price image_url tax_percentage baseStock product_variants.stock product_variants.selling_price product_variants.name product_variants.images product_variants.attributes product_variants.status product_variants.published product_variants._id';

// Get cart for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;

let cart = await Cart.findOne({ customer_id: customerId })
  .populate({
    path: 'items.product_id',
    select: 'name slug selling_price image_url tax_percentage baseStock product_variants'
  })
  .lean();

    if (!cart) {
      cart = new Cart({
        customer_id: customerId,
        items: [],
        total_items: 0,
        total_amount: 0,
        total_discounted_amount: 0
      });
      await cart.save();
      cart = cart.toObject();
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Error fetching cart', error: error.message });
  }
});

// Add item to cart
router.post('/', authenticateHybridToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { product_id, variant_id, quantity = 1 } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, message: 'product_id is required' });
    }

    const requestedQty = parseInt(quantity);

    // STEP 1: Check available stock
    const stockEntry = await Stock.findOne({
      productId: product_id,
      variantId: variant_id || null
    });

    const availableStock = stockEntry ? stockEntry.quantity : null;

    // STEP 2: Find existing cart and check current cart quantity for this item
    let cart = await Cart.findOne({ customer_id: customerId });
    if (!cart) {
      cart = new Cart({
        customer_id: customerId,
        items: [],
        total_items: 0,
        total_amount: 0,
        total_discounted_amount: 0
      });
    }

    // Find if this product/variant already exists in cart
    const existingItemIndex = cart.items.findIndex(item => {
      const productMatch = item.product_id.toString() === product_id.toString();
      const variantMatch = variant_id
        ? item.variant_id?.toString() === variant_id.toString()
        : !item.variant_id;
      return productMatch && variantMatch;
    });

    const currentCartQty = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
    const totalRequestedQty = currentCartQty + requestedQty;

    // STEP 3: Block if exceeds stock
    if (availableStock !== null && totalRequestedQty > availableStock) {
      const remaining = availableStock - currentCartQty;
      if (remaining <= 0) {
        return res.status(400).json({
          success: false,
          message: `You already have the maximum available stock (${availableStock}) in your cart.`
        });
      }
      return res.status(400).json({
        success: false,
        message: `Only ${availableStock} items in stock. You have ${currentCartQty} in your cart, you can add ${remaining} more.`
      });
    }

    // STEP 4: Fetch product details
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let price = product.selling_price || 0;
    let variantName = null;
    let variantAttributes = null;
    let productImage = product.image_url?.[0] || null;

    if (variant_id && product.product_variants) {
      const variant = product.product_variants.find(
        v => v._id.toString() === variant_id.toString()
      );
      if (variant) {
        price = variant.selling_price || price;
        variantName = variant.name || null;
        variantAttributes = variant.attributes || null;
        productImage = variant.images?.[0] || productImage;
      }
    }

    // STEP 5: Update or add item in cart
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity = totalRequestedQty;
    } else {
      cart.items.push({
        product_id,
        variant_id: variant_id || null,
        quantity: requestedQty,
        price,
        discounted_price: price,
        product_name: product.name,
        product_image: productImage,
        variant_name: variantName,
        variant_attributes: variantAttributes,
        tax_percentage: product.tax_percentage || 0,  // ✅ save tax from product
      });
    }

    // Recalculate totals
    cart.total_items = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.total_amount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.total_discounted_amount = cart.items.reduce((sum, item) => sum + ((item.discounted_price || item.price) * item.quantity), 0);

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product_id', PRODUCT_POPULATE_FIELDS)
      .lean();

    res.json({ success: true, message: 'Item added to cart successfully', data: updatedCart });

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Error adding to cart', error: error.message });
  }
});

// Update item quantity in cart
router.put('/update/:itemId', authenticateHybridToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }

    const cart = await Cart.findOne({ customer_id: customerId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    // Stock check on quantity update too
    const cartItem = cart.items[itemIndex];
    const stockEntry = await Stock.findOne({
      productId: cartItem.product_id,
      variantId: cartItem.variant_id || null
    });

    if (stockEntry && parseInt(quantity) > stockEntry.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${stockEntry.quantity} items available in stock.`
      });
    }

    cart.items[itemIndex].quantity = parseInt(quantity);

    // Recalculate totals
    cart.total_items = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.total_amount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.total_discounted_amount = cart.items.reduce((sum, item) => sum + ((item.discounted_price || item.price) * item.quantity), 0);

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product_id', PRODUCT_POPULATE_FIELDS)
      .lean();

    res.json({ success: true, message: 'Cart item updated successfully', data: updatedCart });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ success: false, message: 'Error updating cart item', error: error.message });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', authenticateHybridToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ customer_id: customerId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);

    cart.total_items = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.total_amount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cart.total_discounted_amount = cart.items.reduce((sum, item) => sum + ((item.discounted_price || item.price) * item.quantity), 0);

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product_id', PRODUCT_POPULATE_FIELDS)
      .lean();

    res.json({ success: true, message: 'Item removed from cart successfully', data: updatedCart });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ success: false, message: 'Error removing cart item', error: error.message });
  }
});

// Clear entire cart
router.delete('/clear', authenticateHybridToken, async (req, res) => {
  try {
    const customerId = req.user.id;

    const cart = await Cart.findOneAndUpdate(
      { customer_id: customerId },
      { items: [], total_items: 0, total_amount: 0, total_discounted_amount: 0, updated_at: new Date() },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    res.json({ success: true, message: 'Cart cleared successfully', data: cart });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Error clearing cart', error: error.message });
  }
});

// Get cart item count
router.get('/count', authenticateHybridToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const cart = await Cart.findOne({ customer_id: customerId });
    const itemCount = cart ? cart.total_items : 0;
    res.json({ success: true, data: { count: itemCount } });
  } catch (error) {
    console.error('Error fetching cart count:', error);
    res.status(500).json({ success: false, message: 'Error fetching cart count', error: error.message });
  }
});

// Sync cart from frontend
router.post('/sync', authenticateHybridToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Items must be an array' });
    }

    let cart = await Cart.findOne({ customer_id: customerId });
    if (!cart) {
      cart = new Cart({ customer_id: customerId, items: [] });
    }

    for (const item of items) {
      if (!item.id || !item.name || !item.price || !item.quantity) continue;

      const existingIndex = cart.items.findIndex(existingItem =>
        existingItem.product_id.toString() === (item.productId || item.id) &&
        (item.variantId ? existingItem.variant_sku === item.variantId : !existingItem.variant_sku)
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += parseInt(item.quantity);
      } else {
        cart.items.push({
          product_id: item.productId || item.id,
          variant_sku: item.variantId || null,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          discounted_price: parseFloat(item.price),
          product_name: item.name,
          product_image: item.image,
          variant_name: item.variant ? Object.values(item.variant).join(', ') : null,
          variant_attributes: item.variant || null,
          tax_percentage: item.taxRate ? item.taxRate * 100 : 0  // ✅ save tax on sync too
        });
      }
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate('items.product_id', PRODUCT_POPULATE_FIELDS)
      .lean();

    res.json({ success: true, message: 'Cart synced successfully', data: updatedCart });
  } catch (error) {
    console.error('Error syncing cart:', error);
    res.status(500).json({ success: false, message: 'Error syncing cart', error: error.message });
  }
});

module.exports = router;