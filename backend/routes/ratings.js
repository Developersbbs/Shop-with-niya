const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const { authenticateToken, authorize } = require('../middleware/auth');

// GET all ratings (Admin only)
router.get('/', authenticateToken, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        // Add search functionality if needed (e.g., search by review content or customer name)
        // Note: Searching by customer name would require a lookup/aggregate since it's a ref

        const ratings = await Rating.find(query)
            .populate('customer_id', 'name email')
            .populate('product_id', 'name slug image_url')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Rating.countDocuments(query);

        res.json({
            success: true,
            data: ratings,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch ratings' });
    }
});

// PATCH update rating status (Admin only)
router.patch('/:id/status', authenticateToken, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { status } = req.body;

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, error: 'Invalid status' });
        }

        const rating = await Rating.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!rating) {
            return res.status(404).json({ success: false, error: 'Rating not found' });
        }

        res.json({ success: true, data: rating });
    } catch (error) {
        console.error('Error updating rating status:', error);
        res.status(500).json({ success: false, error: 'Failed to update rating status' });
    }
});

// DELETE rating (Admin only)
router.delete('/:id', authenticateToken, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const rating = await Rating.findByIdAndDelete(req.params.id);

        if (!rating) {
            return res.status(404).json({ success: false, error: 'Rating not found' });
        }

        // Todo: Recalculate product average rating if needed, though usually this is done on read or via a hook.
        // The current implementation in products.js calculates on read or update, but we should double check.
        // Ideally, we should trigger a recalculation on the product.

        res.json({ success: true, message: 'Rating deleted successfully' });
    } catch (error) {
        console.error('Error deleting rating:', error);
        res.status(500).json({ success: false, error: 'Failed to delete rating' });
    }
});

module.exports = router;
