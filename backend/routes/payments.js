const express = require("express");
const Razorpay = require("razorpay");
const Order = require("../models/Order.js");
const OrderItem = require("../models/OrderItem.js");
const Cart = require("../models/Cart.js");
const { authenticateHybridToken } = require('../middleware/hybridAuth');
const { deductStockForOrder } = require('../helpers/stockHelper');

const router = express.Router();

// Initialize Razorpay
let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay initialized successfully');
  } else {
    console.warn('⚠️  Razorpay credentials not found.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Razorpay:', error.message);
  razorpay = null;
}

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Payment routes are working",
    timestamp: new Date().toISOString(),
    razorpay_configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  });
});

// Create Razorpay order
router.post("/create-order", authenticateHybridToken, async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({
        error: "Payment gateway not configured. Please contact administrator."
      });
    }

    const {
      shipping_address,
      items,
      shipping_cost = 0,
      tax_amount = 0,   // ✅ Use tax sent from frontend (already calculated correctly)
      coupon_id = null
    } = req.body;

    const customer_id = req.user.id;

    if (!customer_id || !shipping_address || !items || items.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: shipping_address, items"
      });
    }

    // ✅ FIX: Use subtotal + shipping + tax_amount sent from frontend
    // Do NOT recalculate tax here — frontend already computed it correctly
    // and sent it as tax_amount. Recalculating here caused mismatch because
    // items array does not include taxRate.
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const tax = parseFloat(tax_amount) || 0;
    const total_amount = subtotal + parseFloat(shipping_cost) + tax;

    console.log("💰 Payment totals:");
    console.log("  subtotal    :", subtotal);
    console.log("  shipping    :", shipping_cost);
    console.log("  tax_amount  :", tax);
    console.log("  total_amount:", total_amount);

    // Convert to paise
    const amountInPaise = Math.round(total_amount * 100);

    // Generate invoice number
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoice_no = `ORD-${timestamp}-${randomNum}`;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: invoice_no,
      payment_capture: 1,
    };

    const razorpayOrderPromise = razorpay.orders.create(options);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Razorpay API timeout')), 5000)
    );
    const razorpayOrder = await Promise.race([razorpayOrderPromise, timeoutPromise]);

    const order = new Order({
      customer_id,
      coupon_id,
      invoice_no,
      payment_method: 'razorpay',
      shipping_cost,
      total_amount,
      status: 'payment_pending',
      shipping_address,
      razorpay_order_id: razorpayOrder.id,
      payment_status: 'pending',
      estimated_delivery: null,
      tracking_number: null
    });

    const savedOrder = await order.save();

    const orderItems = items.map(item => ({
      order_id: invoice_no,
      product_id: item.product_id,
      variant_id: item.variant_id || null,   // ← ADD THIS
      quantity: item.quantity,
      unit_price: item.unit_price
    }));

    await OrderItem.insertMany(orderItems);

    res.status(201).json({
      success: true,
      message: "Razorpay order created successfully",
      order: {
        ...savedOrder.toObject(),
        items: orderItems,
        subtotal,
        tax,
        total: total_amount
      },
      razorpay_order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      }
    });

  } catch (error) {
    console.error('❌ Create order error:', error.message);
    res.status(500).json({
      error: "Failed to create Razorpay order",
      details: error.message
    });
  }
});

// Verify Razorpay payment
router.post("/verify-payment", authenticateHybridToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return res.status(400).json({ error: "Missing required payment verification fields" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = require("crypto")
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: "Payment verification failed - invalid signature" });
    }

    const order = await Order.findOne({ invoice_no: order_id });
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.customer_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Unauthorized to access this order" });
    }

    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
    order.payment_status = 'completed';
    order.status = 'processing';

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 7) + 7);
    order.estimated_delivery = estimatedDelivery;

    await order.save();

    // ✅ FIX: Sync OrderItems into order.items so My Orders shows correct count & images
    const orderItemDocs = await OrderItem.find({ order_id: order.invoice_no });
    if (orderItemDocs.length > 0 && (!order.items || order.items.length === 0)) {
      order.items = orderItemDocs.map(i => ({
        product_id: i.product_id,
        variant_id: i.variant_id || null,
        quantity: i.quantity,
        price: i.unit_price || i.price || 0,
        subtotal: (i.unit_price || i.price || 0) * i.quantity
      }));
      await order.save();
    }

    await deductStockForOrder(order.items, order.invoice_no);
    await Cart.deleteMany({ customer_id: req.user.id });

    res.json({
      success: true,
      message: "Payment verified and order confirmed successfully",
      order,
      payment_details: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: "Payment verification failed", details: error.message });
  }
});

// Handle payment failure
router.post("/payment-failed", authenticateHybridToken, async (req, res) => {
  try {
    const { order_id, error_description } = req.body;
    const order = await Order.findOne({ invoice_no: order_id });

    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.customer_id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    order.status = 'cancelled';
    order.payment_status = 'failed';
    await order.save();

    res.json({ success: true, message: "Payment failure recorded", order });
  } catch (error) {
    res.status(500).json({ error: "Failed to handle payment failure", details: error.message });
  }
});

// Get Razorpay config
router.get("/config", (req, res) => {
  if (!razorpay || !process.env.RAZORPAY_KEY_ID) {
    return res.status(503).json({ error: "Payment gateway not configured", configured: false });
  }
  res.json({ key_id: process.env.RAZORPAY_KEY_ID, currency: "INR", configured: true });
});

module.exports = router;