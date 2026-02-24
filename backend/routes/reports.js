const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Helper function to get date range filters
const getDateFilter = (startDate, endDate) => {
    const filter = {};
    if (startDate || endDate) {
        filter.order_time = {};
        if (startDate) filter.order_time.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filter.order_time.$lte = end;
        }
    }
    return filter;
};

// GET /api/reports/sales
// Returns aggregated sales data aggregated by day
router.get('/sales', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const matchStage = getDateFilter(startDate, endDate);

        const salesData = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$order_time" } },
                    totalSales: { $sum: "$total_amount" },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ success: true, data: salesData });
    } catch (err) {
        console.error('Error fetching sales report:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/reports/orders
// Returns order status counts
router.get('/orders', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const matchStage = getDateFilter(startDate, endDate);

        const orderStatusData = await Order.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedData = orderStatusData.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.json({ success: true, data: formattedData });
    } catch (err) {
        console.error('Error fetching orders report:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/reports/products/top
// Returns top 10 best selling products
router.get('/products/top', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const matchStage = getDateFilter(startDate, endDate);

        // Need to lookup product details
        // Since we are aggregating on subdocuments (items), we unwind first

        const topProducts = await Order.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product_id",
                    totalQuantity: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: "$items.subtotal" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $project: {
                    _id: 1,
                    name: "$productDetails.name",
                    totalQuantity: 1,
                    totalRevenue: 1
                }
            }
        ]);

        res.json({ success: true, data: topProducts });
    } catch (err) {
        console.error('Error fetching top products:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
