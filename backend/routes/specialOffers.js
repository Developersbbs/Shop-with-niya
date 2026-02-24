const router = require('express').Router();
const SpecialOffer = require('../models/SpecialOffer');

// GET all active special offers (for homepage)
router.get('/', async (req, res) => {
    try {
        const offers = await SpecialOffer.find({ isActive: true })
            .sort({ order: 1 })
            .limit(6);

        res.json({
            success: true,
            data: offers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET all special offers (for admin)
router.get('/admin', async (req, res) => {
    try {
        const offers = await SpecialOffer.find()
            .sort({ order: 1 });

        res.json({
            success: true,
            data: offers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET single special offer by ID
router.get('/:id', async (req, res) => {
    try {
        const offer = await SpecialOffer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                error: 'Special offer not found'
            });
        }

        res.json({
            success: true,
            data: offer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// CREATE new special offer
router.post('/', async (req, res) => {
    try {
        const { title, description, icon, bgColor, isActive } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                error: 'Title and description are required'
            });
        }

        // Get highest order to append to end
        const lastOffer = await SpecialOffer.findOne().sort({ order: -1 });
        const newOrder = lastOffer ? lastOffer.order + 1 : 0;

        const offer = new SpecialOffer({
            title: title.trim(),
            description: description.trim(),
            icon: icon || 'FaGift',
            bgColor: bgColor || 'from-rose-50 to-rose-100',
            order: newOrder,
            isActive: isActive !== undefined ? isActive : true
        });

        await offer.save();

        res.status(201).json({
            success: true,
            data: offer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// UPDATE special offer
router.put('/:id', async (req, res) => {
    try {
        const { title, description, icon, order, isActive } = req.body;

        const offer = await SpecialOffer.findByIdAndUpdate(
            req.params.id,
            {
                ...(title && { title }),
                ...(description && { description }),
                ...(icon && { icon }),
                ...(order !== undefined && { order }),
                ...(isActive !== undefined && { isActive })
            },
            { new: true, runValidators: true }
        );

        if (!offer) {
            return res.status(404).json({
                success: false,
                error: 'Special offer not found'
            });
        }

        res.json({
            success: true,
            data: offer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE special offer
router.delete('/:id', async (req, res) => {
    try {
        const offer = await SpecialOffer.findByIdAndDelete(req.params.id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                error: 'Special offer not found'
            });
        }

        // Reorganize orders - update all offers with order > deleted offer order
        if (offer.order !== undefined) {
            try {
                const offersToUpdate = await SpecialOffer.find({ order: { $gt: offer.order } })
                    .sort({ order: 1 });

                // Update each offer's order (decrement by 1)
                for (const offerToUpdate of offersToUpdate) {
                    await SpecialOffer.findByIdAndUpdate(offerToUpdate._id, {
                        order: offerToUpdate.order - 1
                    });
                }
                
                console.log(`Reorganized orders for ${offersToUpdate.length} offers after deletion`);
            } catch (reorderError) {
                console.warn("Failed to reorganize orders after deletion:", reorderError);
                // Don't fail the deletion if reorganization fails
            }
        }

        res.json({
            success: true,
            message: 'Special offer deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;