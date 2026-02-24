const express = require("express");
const Order = require("../models/Order.js");
const router = express.Router();

// GET dashboard sales overview
router.get("/sales-overview", async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Helper function to calculate total sales for a date range
    const calculateSales = async (startDate, endDate) => {
      const matchStage = {
        order_time: { $gte: startDate }
      };
      
      if (endDate) {
        matchStage.order_time.$lte = endDate;
      }

      const result = await Order.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: "$total_amount" } } }
      ]);
      
      return result.length > 0 ? result[0].total : 0;
    };

    // Calculate sales for different periods
    const [todaySales, yesterdaySales, thisMonthSales, lastMonthSales, allTimeSales] = await Promise.all([
      calculateSales(today),
      calculateSales(yesterday, today),
      calculateSales(thisMonthStart),
      calculateSales(lastMonthStart, lastMonthEnd),
      calculateSales(new Date(0)) // All time
    ]);

    res.json({
      success: true,
      data: {
        todayOrders: todaySales,
        yesterdayOrders: yesterdaySales,
        thisMonth: thisMonthSales,
        lastMonth: lastMonthSales,
        allTimeSales: allTimeSales
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// GET dashboard order status overview
router.get("/status-overview", async (req, res) => {
  try {
    // Count orders by status
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Count total orders
    const totalOrders = await Order.countDocuments();

    // Convert to object with default values
    const statusData = {
      total: totalOrders,
      pending: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0,
      shipped: 0
    };

    // Populate with actual counts
    statusCounts.forEach(item => {
      const status = item._id.toLowerCase();
      if (status in statusData) {
        statusData[status] = item.count;
      }
    });

    res.json({
      success: true,
      data: statusData
    });
  } catch (err) {
    console.error('Error fetching order status data:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// GET weekly sales and orders data
router.get("/weekly-data", async (req, res) => {
  try {
    const now = new Date();
    const days = 7;
    
    // Generate dates for the last 7 days
    const weeklyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      // Get sales data for this day
      const salesData = await Order.aggregate([
        {
          $match: {
            order_time: { $gte: date, $lt: nextDate }
          }
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$total_amount" },
            orderCount: { $sum: 1 }
          }
        }
      ]);
      
      const dayData = salesData.length > 0 ? salesData[0] : { totalSales: 0, orderCount: 0 };
      
      weeklyData.push({
        date: date.toISOString().split('T')[0], // YYYY-MM-DD format
        sales: dayData.totalSales || 0,
        orders: dayData.orderCount || 0
      });
    }

    res.json({
      success: true,
      data: weeklyData
    });
  } catch (err) {
    console.error('Error fetching weekly data:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});


// GET best selling products
router.get("/best-sellers", async (req, res) => {
  try {
    const Product = require('../models/Product');
    
    // Get all products first
    const allProducts = await Product.find({}, 'name');
    console.log(`Found ${allProducts.length} products in database`);
    
    // Create a map of product IDs to names
    const productMap = {};
    allProducts.forEach(product => {
      productMap[product._id.toString()] = product.name;
    });

    // Get best selling products
    const bestSellers = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    // Map product details with better error handling
    const productsWithDetails = bestSellers.map(seller => {
      const productId = seller._id ? seller._id.toString() : null;
      const productName = productId ? (productMap[productId] || 'Product Not Found') : 'Invalid Product ID';
      
      return {
        productId: productId,
        productName: productName,
        totalQuantity: seller.totalQuantity,
        totalRevenue: seller.totalRevenue,
        originalId: seller._id
      };
    });

    res.json({
      success: true,
      data: productsWithDetails
    });
  } catch (err) {
    console.error('Error in /best-sellers:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});
 
module.exports = router;