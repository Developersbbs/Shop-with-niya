require("dotenv").config();

const express = require("express");
const connectDB = require("./lib/mongodb");
const cors = require("cors");
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();

// Initialize Firebase Admin SDK
const firebaseAdmin = require('./lib/firebase');
console.log('🔥 Firebase Admin SDK status:', firebaseAdmin ? 'Initialized' : 'Not initialized');

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://127.0.0.1:3003',
  'http://localhost:5173', // Vite default port
  'http://localhost:5174', // Vite alternate port
  'http://127.0.0.1:5175',
  'https://admin-shop-with-niya.netlify.app',
  'https://shop-with-niya.netlify.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

// Simple CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Check if the request origin is in the allowed list
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

// JSON and URL-encoded body parsing
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

// Configure body parsing to skip multipart/form-data
app.use((req, res, next) => {
  const contentType = req.get('content-type');
  if (contentType && contentType.includes('multipart/form-data')) {
    // Skip body parsing for multipart requests
    return next();
  }
  express.json()(req, res, next);
});

app.use((req, res, next) => {
  const contentType = req.get('content-type');
  if (contentType && contentType.includes('multipart/form-data')) {
    // Skip URL encoding for multipart requests
    return next();
  }
  express.urlencoded({ extended: true })(req, res, next);
});

app.use(cookieParser());

// Import routes
const { router: authRoutes } = require("./routes/auth");
const staffRolesRoutes = require("./routes/staffRoles");
const staffRoutes = require("./routes/staff");
const categoriesRoutes = require("./routes/categories");
const subcategoriesRoutes = require("./routes/subcategories");
const productsRoutes = require("./routes/products");
const customersRoutes = require("./routes/customers");
const couponsRoutes = require("./routes/coupons");
const ordersRoutes = require("./routes/orders");
const orderItemsRoutes = require("./routes/orderItems");
const notificationsRoutes = require("./routes/notifications");
const inventoryLogsRoutes = require("./routes/inventoryLogs");
const stockRoutes = require("./routes/stock");
const cartRoutes = require("./routes/cart");
const wishlistRoutes = require("./routes/wishlist");
const authTokenRoutes = require("./routes/auth-token");
const addressesRoutes = require("./routes/addresses");
const paymentsRoutes = require("./routes/payments");
const dashboardRoutes = require("./routes/dashboard");
const heroRoutes = require("./routes/heroSection");
const specialOffersRoutes = require("./routes/specialOffers");
const marqueeOffersRoutes = require("./routes/marqueeOffer");
const comboOffersRoutes = require("./routes/comboOffers");
const offerPopupsRoutes = require("./routes/offerPopups");
const offersRoutes = require("./routes/offers");
const reportsRoutes = require("./routes/reports");
const adminNotificationRoutes = require("./routes/AdminNotification");

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/staffRoles", staffRolesRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/subcategories", subcategoriesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/orderItems", orderItemsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/inventoryLogs", inventoryLogsRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/auth-token", authTokenRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/hero-section", heroRoutes);
app.use("/api/special-offers", specialOffersRoutes);
app.use("/api/marquee-offers", marqueeOffersRoutes);
app.use("/api/combo-offers", comboOffersRoutes);
app.use("/api/offer-popups", offerPopupsRoutes)
app.use("/api/offers", offersRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/ratings", require("./routes/ratings"));

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5000;


const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
});

server.setTimeout(300000); 
