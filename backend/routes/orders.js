const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order.js");
const OrderItem = require("../models/OrderItem.js");
const Cart = require("../models/Cart.js");
const { authenticateToken } = require('../middleware/auth');
const { authenticateFirebaseToken } = require('../middleware/firebaseAuth');
const { authenticateHybridToken } = require('../middleware/hybridAuth');
const { deductStockForOrder } = require('../helpers/stockHelper');


const router = express.Router();

// Test route to verify orders routes are loading
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Orders routes are working",
    timestamp: new Date().toISOString()
  });
});

// Check if user has purchased a specific product
router.get("/check-purchase/:productId", authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const Customer = require('../models/Customer');

    // Use authenticated user's ID
    const customerId = req.user.id;

    // For JWT auth, find customer by ID
    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.json({
        success: true,
        hasPurchased: false
      });
    }

    // Check if customer has purchased this product using new embedded items schema
    const hasPurchased = await Order.findOne({
      customer_id: customer._id,
      status: { $in: ['processing', 'shipped', 'delivered'] }, // Include processing orders for testing
      'items.product_id': productId
    });

    res.json({
      success: true,
      hasPurchased: !!hasPurchased
    });
  } catch (err) {
    console.error("Error checking purchase status:", err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET all orders with pagination and filtering
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      method,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    let filter = {};

    if (search) {
      filter.$or = [
        { invoice_no: { $regex: search, $options: "i" } },
        { "shipping_address.name": { $regex: search, $options: "i" } },
        { "shipping_address.email": { $regex: search, $options: "i" } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (method) {
      filter.payment_method = method;
    }

    if (startDate || endDate) {
      filter.order_time = {};
      if (startDate) {
        filter.order_time.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.order_time.$lte = new Date(endDate);
      }
    }

    // Execute queries
    const orders = await Order.find(filter)
      .populate({
        path: "customer_id",
        select: "name email phone",
        model: "Customers",
      })
      .select('-__v')
      .sort({ order_time: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Order.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    // Transform orders to match frontend structure
    const transformedOrders = orders.map(order => {
      const transformed = {
        ...order.toObject(),
        id: order._id.toString(), // Ensure ID is a string
        customers: {
          name: order.customer_id?.name || order.shipping_address?.name,
          address: `${order.shipping_address?.street || ''}, ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} ${order.shipping_address?.zipCode || ''}`.trim(),
          phone: order.shipping_address?.phone || order.customer_id?.phone
        },
        customer: order.customer_id
      };

      console.log('🔍 Transformed order:', {
        _id: order._id,
        id: transformed.id,
        invoice_no: order.invoice_no
      });

      return transformed;
    });

    res.json({
      success: true,
      items: transformedOrders,
      pagination: {
        total,
        current: pageNum,
        limit: limitNum,
        pages: totalPages,
        prev: pageNum > 1 ? pageNum - 1 : null,
        next: pageNum < totalPages ? pageNum + 1 : null,
      },
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET orders by customer ID
router.get("/customer/:customerId", authenticateHybridToken, async (req, res) => {
  try {
    const orders = await Order.find({ customer_id: req.params.customerId })
      .sort({ order_time: -1 });

    // Get order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({ order_id: order.invoice_no });
        return {
          ...order.toObject(),
          items: items
        };
      })
    );

    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET orders by Firebase UID (for frontend compatibility)
router.get("/customer/firebase/:firebaseUid", authenticateHybridToken, async (req, res) => {
  console.log('Firebase orders route called with UID:', req.params.firebaseUid);
  try {
    const Customer = require('../models/Customer');

    // Find customer by Firebase UID
    const customer = await Customer.findOne({ firebase_uid: req.params.firebaseUid });
    console.log('Customer found:', customer ? customer._id : 'Not found');
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const orders = await Order.find({ customer_id: customer._id.toString() })
      .sort({ order_time: -1 });

    console.log('Orders found:', orders.length);

    // Enhance items with product information (items are now embedded in order)
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const enhancedItems = await Promise.all(
          order.items.map(async (item) => {
            try {
              const Product = require('../models/Product');
              const product = await Product.findById(item.product_id);
              return {
                ...item.toObject(),
                id: item._id,
                name: product ? product.name : 'Product Not Found',
                slug: product ? product.slug : null,
                image: product && product.image_url && product.image_url.length > 0
                  ? product.image_url[0]
                  : '/images/products/placeholder-product.svg',
                sku: product ? product.sku : 'N/A',
                price: item.price || 0 // Use price field from new schema
              };
            } catch (error) {
              return {
                ...item.toObject(),
                id: item._id,
                name: 'Product Not Found',
                image: '/images/products/placeholder-product.svg',
                sku: 'N/A',
                price: item.price || 0
              };
            }
          })
        );

        return {
          ...order.toObject(),
          items: enhancedItems,
          shipping_address: order.shipping_address || {} // Include shipping address if stored
        };
      })
    );

    res.json(ordersWithItems);
  } catch (err) {
    console.error('Error fetching orders by Firebase UID:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export orders to CSV
router.get("/export", async (req, res) => {
  try {
    const { search, status, method, startDate, endDate } = req.query;

    // Build filter query
    let filter = {};

    if (search) {
      filter.$or = [
        { invoice_no: { $regex: search, $options: "i" } },
        { "shipping_address.name": { $regex: search, $options: "i" } },
        { "shipping_address.email": { $regex: search, $options: "i" } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (method) {
      filter.payment_method = method;
    }

    if (startDate || endDate) {
      filter.order_time = {};
      if (startDate) {
        filter.order_time.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.order_time.$lte = new Date(endDate);
      }
    }

    // Fetch orders with customer data
    const orders = await Order.find(filter)
      .populate({
        path: "customer_id",
        select: "name email phone",
        model: "Customers",
      })
      .sort({ order_time: -1 });

    // Transform orders for CSV
    const csvOrders = orders.map(order => ({
      'Invoice No': order.invoice_no,
      'Order Date': new Date(order.order_time).toLocaleDateString(),
      'Customer Name': order.customer_id?.name || order.shipping_address?.name || 'N/A',
      'Customer Email': order.shipping_address?.email || order.customer_id?.email || 'N/A',
      'Customer Phone': order.shipping_address?.phone || order.customer_id?.phone || 'N/A',
      'Payment Method': order.payment_method,
      'Order Status': order.status,
      'Shipping Cost': order.shipping_cost || 0,
      'Total Amount': order.total_amount,
      'Shipping Address': `${order.shipping_address?.street || ''}, ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} ${order.shipping_address?.zipCode || ''}`.trim()
    }));

    // Convert to CSV
    const csv = convertToCSV(csvOrders);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders_export_${new Date().toISOString().split('T')[0]}.csv`);

    res.send(csv);
  } catch (err) {
    console.error('Error exporting orders:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Helper function to convert array of objects to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');

  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle values that contain commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });

  return csvHeaders + '\n' + csvRows.join('\n');
}

// GET a single order by id
router.get("/:id", async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log('🔍 Fetching order with ID:', orderId);

    const order = await Order.findOne({ _id: orderId })
      .populate({
        path: "customer_id",
        select: "name email phone",
        model: "Customers",
      })
      .select('-__v');

    if (!order) {
      console.log('❌ Order not found with ID:', orderId);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log('✅ Found order:', {
      _id: order._id,
      invoice_no: order.invoice_no,
      status: order.status
    });

    // Get order items with product details
    const items = await OrderItem.find({ order_id: order.invoice_no });

    // Enhance items with product information
    const enhancedItems = await Promise.all(
      items.map(async (item) => {
        try {
          const Product = require('../models/Product');
          const product = await Product.findById(item.product_id);
          return {
            ...item.toObject(),
            id: item._id,
            slug: product ? product.slug : null,
            unit_price: item.unit_price || item.price || 0,
            quantity: item.quantity || 1,
            products: {
              name: product ? product.name : 'Product Not Found',
              image: product ? product.images?.[0]?.url : '/images/products/placeholder-product.svg',
              sku: product ? product.sku : 'N/A'
            }
          };
        } catch (error) {
          return {
            ...item.toObject(),
            id: item._id,
            unit_price: item.unit_price || item.price || 0,
            quantity: item.quantity || 1,
            products: {
              name: 'Product Not Found',
              image: '/images/products/placeholder-product.svg',
              sku: 'N/A'
            }
          };
        }
      })
    );

    // Transform order to match frontend structure
    const transformedOrder = {
      ...order.toObject(),
      id: order._id.toString(), // Ensure ID is a string
      customers: {
        name: order.customer_id?.name || order.shipping_address?.name || 'N/A',
        email: order.shipping_address?.email || order.customer_id?.email || 'N/A',
        address: `${order.shipping_address?.street || ''}, ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} ${order.shipping_address?.zipCode || ''}`.trim(),
        phone: order.shipping_address?.phone || order.customer_id?.phone
      },
      customer: order.customer_id,
      order_items: enhancedItems,
      coupons: order.coupons || null
    };

    console.log('🔍 Transformed single order:', {
      _id: order._id,
      id: transformedOrder.id,
      invoice_no: order.invoice_no
    });

    res.json({
      success: true,
      data: transformedOrder
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST place order (Cash on Delivery)
router.post("/place-order", authenticateHybridToken, async (req, res) => {
  try {
    const {
      payment_method,
      shipping_address,
      items,
      shipping_cost = 0,
      coupon_id = null
    } = req.body;

    // Get customer_id from authenticated user
    const customer_id = req.user.id;

    // Validate required fields
    if (!customer_id || !payment_method || !shipping_address || !items || items.length === 0) {
      return res.status(400).json({
        error: "Missing required fields: payment_method, shipping_address, items"
      });
    }

    // Only allow cash on delivery for now
    if (payment_method !== 'cash') {
      return res.status(400).json({
        error: "Only Cash on Delivery payment method is supported"
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total_amount = subtotal + shipping_cost + tax;

    // Generate invoice number
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoice_no = `ORD-${timestamp}-${randomNum}`;

    // Calculate estimated delivery (7-14 days from order time)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 7) + 7); // 7-14 days

    // Prepare items array for new schema
    const orderItems = items.map(item => ({
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      quantity: item.quantity,
      price: item.unit_price, // selling price
      subtotal: item.unit_price * item.quantity
    }));

    // Create order with embedded items
    const order = new Order({
      customer_id,
      items: orderItems, // Embedded items array
      shipping_cost,
      total_amount,
      payment_method,
      shipping_address, // Store shipping address in database
      invoice_no,
      estimated_delivery: estimatedDelivery,
      tracking_number: null, // Will be set when shipped
      status: 'processing' // Cash on delivery starts as processing
    });

    // ✅ Validate stock availability before placing order
const Stock = require('../models/Stock');
for (const item of orderItems) {
  const stockEntry = await Stock.findOne({
    productId: item.product_id,
    variantId: item.variant_id || null
  });

  if (stockEntry && item.quantity > stockEntry.quantity) {
    return res.status(400).json({
      error: `Insufficient stock for one or more items. Only ${stockEntry.quantity} available.`,
      product_id: item.product_id
    });
  }
}

    const savedOrder = await order.save();

    // ✅ Deduct stock immediately after order is placed
    await deductStockForOrder(orderItems, invoice_no);

    // Clear user's cart after successful order
    await Cart.deleteMany({ customer_id });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: {
        ...savedOrder.toObject(),
        subtotal,
        tax,
        total: total_amount
      }
    });

  } catch (err) {
    console.error('Order placement error:', err);
    res.status(500).json({ error: "Failed to place order", details: err.message });
  }
});

// POST create new order (legacy)
router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update order
router.put("/:id", async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update order status with stock management
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    // Validate status
    const validStatuses = ["delivered", "cancelled", "pending", "processing", "shipped", "dispatched"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Get the current order to check previous status
    const currentOrder = await Order.findById(orderId);
    if (!currentOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // ✅ Stock deduction removed from here — it now happens at checkout/payment

    // Update the order status
    const updateData = {
      status,
      updated_at: new Date()
    };

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (err) {
    console.error('Order status update error:', err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// PATCH update order status (admin functionality)
router.patch("/:id/status", authenticateHybridToken, async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    // Validate status
    const validStatuses = ["delivered", "cancelled", "pending", "processing", "shipped"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updateData = {
      status,
      updated_at: new Date()
    };

    // If status is shipped and tracking number provided, add tracking
    if (status === 'shipped' && trackingNumber) {
      updateData.tracking_number = trackingNumber;

      // Set estimated delivery if not already set
      if (!updateData.estimated_delivery) {
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5); // 5 days for delivery
        updateData.estimated_delivery = estimatedDelivery;
      }
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (err) {
    console.error('Order status update error:', err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// GET track order by tracking number
router.get("/track/:trackingNumber", async (req, res) => {
  try {
    const order = await Order.findOne({ tracking_number: req.params.trackingNumber });
    if (!order) return res.status(404).json({ error: "Tracking number not found" });

    // Get order items
    const items = await OrderItem.find({ order_id: order.invoice_no });

    res.json({
      orderId: order.invoice_no,
      status: order.status,
      estimatedDelivery: order.estimated_delivery,
      trackingNumber: order.tracking_number,
      shippingAddress: order.shipping_address,
      items: items,
      orderTime: order.order_time
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET order invoice (HTML generation)
router.get("/:id/invoice", authenticateHybridToken, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const OrderItem = require('../models/OrderItem');
    const Customer = require('../models/Customer');
    const Product = require('../models/Product');
    const puppeteer = require('puppeteer');

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const customer = await Customer.findById(order.customer_id);

    const enhancedItems = await Promise.all(
      order.items.map(async (item) => {
        try {
          const product = await Product.findById(item.product_id);
          return {
            ...item.toObject(),
            name: product ? product.name : 'Product Not Found',
            sku: product ? product.sku : 'N/A',
            unit_price: item.price || 0
          };
        } catch (error) {
          return {
            ...item.toObject(),
            name: 'Product Not Found',
            sku: 'N/A',
            unit_price: item.price || 0
          };
        }
      })
    );

    const subtotal = enhancedItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const shipping = order.shipping_cost || 0;
    const total = order.total_amount;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${order.invoice_no}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 40px; }

        .header { text-align: center; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #f0f0f0; }
        .brand { font-size: 26px; font-weight: 800; color: #1a3a2a; letter-spacing: 2px; text-transform: uppercase; }
        .invoice-title { font-size: 13px; letter-spacing: 4px; text-transform: uppercase; color: #888; margin-top: 4px; }

        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
        .meta-box { background: #f9f9f7; border: 1px solid #ebebeb; border-radius: 8px; padding: 16px 20px; }
        .meta-box h4 { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #aaa; margin-bottom: 10px; }
        .meta-box p { font-size: 13px; color: #333; line-height: 1.7; }
        .meta-box p strong { color: #111; }

        .section-title { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #aaa; margin-bottom: 10px; }

        .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
        .address-box { background: #f9f9f7; border: 1px solid #ebebeb; border-radius: 8px; padding: 16px 20px; }
        .address-box h4 { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #aaa; margin-bottom: 10px; }
        .address-box p { font-size: 13px; color: #444; line-height: 1.8; }
        .address-box .name { font-weight: 700; color: #111; font-size: 14px; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
        thead tr { background: #1a3a2a; }
        thead th { padding: 11px 14px; text-align: left; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #fff; font-weight: 600; }
        tbody tr { border-bottom: 1px solid #f0f0f0; }
        tbody tr:hover { background: #fafaf8; }
        tbody td { padding: 12px 14px; font-size: 13px; color: #333; }

        .totals { margin-left: auto; width: 280px; margin-top: 16px; }
        .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #555; }
        .total-row.final { border-top: 2px solid #1a3a2a; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 800; color: #1a3a2a; }

        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; text-transform: capitalize; background: #fef3c7; color: #92400e; }
        .status-badge.delivered { background: #d1fae5; color: #065f46; }
        .status-badge.cancelled { background: #fee2e2; color: #991b1b; }
        .status-badge.shipped { background: #dbeafe; color: #1e40af; }

        .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #f0f0f0; text-align: center; }
        .footer p { font-size: 11px; color: #bbb; line-height: 1.8; }
      </style>
    </head>
    <body>

      <div class="header">
        <div class="brand">Shop with Niya</div>
        <div class="invoice-title">Invoice</div>
      </div>

      <div class="meta-grid">
        <div class="meta-box">
          <h4>Invoice Details</h4>
          <p><strong>Invoice No:</strong> ${order.invoice_no}</p>
          <p><strong>Order Date:</strong> ${new Date(order.order_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status}</span></p>
          <p><strong>Payment:</strong> ${order.payment_method === 'cash' ? 'Cash on Delivery' : order.payment_method}</p>
        </div>
        <div class="meta-box">
          <h4>Billing Details</h4>
          <p><strong>${customer?.name || order.shipping_address?.name || 'N/A'}</strong></p>
          <p>${customer?.email || order.shipping_address?.email || 'N/A'}</p>
          <p>${customer?.phone || order.shipping_address?.phone || 'N/A'}</p>
        </div>
      </div>

      <div class="address-grid">
        <div class="address-box">
          <h4>Shipping Address</h4>
          <p class="name">${order.shipping_address?.name || 'N/A'}</p>
          <p>${order.shipping_address?.street || ''}</p>
          <p>${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} ${order.shipping_address?.zipCode || ''}</p>
          <p>${order.shipping_address?.country || 'India'}</p>
          ${order.shipping_address?.phone ? `<p>${order.shipping_address.phone}</p>` : ''}
        </div>
        <div class="address-box">
          <h4>Delivery Info</h4>
          ${order.estimated_delivery ? `<p><strong>Est. Delivery:</strong> ${new Date(order.estimated_delivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>` : ''}
          ${order.tracking_number ? `<p><strong>Tracking No:</strong> ${order.tracking_number}</p>` : '<p>Tracking not available yet</p>'}
        </div>
      </div>

      <p class="section-title">Order Items</p>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Unit Price</th>
            <th style="text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${enhancedItems.map(item => `
            <tr>
              <td>${item.name}</td>
              <td style="color:#999">${item.sku}</td>
              <td style="text-align:center">${item.quantity}</td>
              <td style="text-align:right">₹${item.unit_price.toFixed(2)}</td>
              <td style="text-align:right">₹${(item.unit_price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        <div class="total-row"><span>Tax (10%)</span><span>₹${tax.toFixed(2)}</span></div>
        <div class="total-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : '₹' + shipping.toFixed(2)}</span></div>
        <div class="total-row final"><span>Total</span><span>₹${total.toFixed(2)}</span></div>
      </div>

      <div class="footer">
        <p>This is a computer-generated invoice. No signature required.</p>
        <p>Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;·&nbsp; Niya by Yuktha Fashion Studio</p>
      </div>

    </body>
    </html>
    `;

    // Launch puppeteer and convert HTML → real PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();

    // Send real PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.invoice_no}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);

  } catch (err) {
    console.error('Error generating invoice:', err);
    res.status(500).json({ error: err.message });
  }
});
// DELETE order
router.delete("/:id", async (req, res) => {
  try {
    const result = await Order.findOneAndDelete({ id: req.params.id });
    if (!result) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
