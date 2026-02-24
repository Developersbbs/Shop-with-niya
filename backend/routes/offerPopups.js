const router = require('express').Router();
const OfferPopup = require('../models/OfferPopup');
const path = require('path');
const fs = require('fs');

const normalizeBoolean = (value, defaultValue) => {
    if (value === undefined || value === null) return defaultValue;

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true' || normalized === '1') return true;
        if (normalized === 'false' || normalized === '0') return false;
        return defaultValue;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    return Boolean(value);
};

// GET active popup for frontend (public route)
router.get('/', async (req, res) => {
    try {
        const popups = await OfferPopup.find({ isActive: true })
            .sort({ priority: -1, createdAt: -1 });

        // Filter popups that are currently valid based on date range
        const validPopups = popups.filter(popup => popup.isCurrentlyValid());

        // Return the highest priority valid popup
        const activePopup = validPopups.length > 0 ? validPopups[0] : null;

        res.json({
            success: true,
            data: activePopup
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET all popups for admin
router.get('/admin', async (req, res) => {
    try {
        const popups = await OfferPopup.find()
            .sort({ priority: -1, createdAt: -1 });

        res.json({
            success: true,
            data: popups
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET single popup by ID
router.get('/:id', async (req, res) => {
    try {
        const popup = await OfferPopup.findById(req.params.id);

        if (!popup) {
            return res.status(404).json({
                success: false,
                error: 'Offer popup not found'
            });
        }

        res.json({
            success: true,
            data: popup
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// CREATE new popup with Firebase image URL
router.post('/', async (req, res) => {
    try {
        const { heading, description, buttonText, buttonLink, isActive, priority, startDate, endDate, image, linked_offer } = req.body;

        if (!heading || !description) {
            return res.status(400).json({
                success: false,
                error: 'Heading and description are required'
            });
        }

        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'Image is required'
            });
        }

        const popup = new OfferPopup({
            image: image, // Firebase Storage URL
            heading,
            description,
            buttonText: buttonText || 'Shop Now',
            buttonLink: buttonLink || '/products',
            isActive: normalizeBoolean(isActive, true),
            priority: priority ? parseInt(priority) : 0,
            startDate: startDate || null,
            endDate: endDate || null,
            linked_offer: linked_offer || null
        });

        await popup.save();

        res.status(201).json({
            success: true,
            data: popup
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// UPDATE popup with Firebase image URL
router.put('/:id', async (req, res) => {
    try {
        const { heading, description, buttonText, buttonLink, isActive, priority, startDate, endDate, image, linked_offer } = req.body;

        const popup = await OfferPopup.findById(req.params.id);

        if (!popup) {
            return res.status(404).json({
                success: false,
                error: 'Offer popup not found'
            });
        }

        // Update fields
        if (heading) popup.heading = heading;
        if (description) popup.description = description;
        if (buttonText) popup.buttonText = buttonText;
        if (buttonLink) popup.buttonLink = buttonLink;
        const normalizedIsActive = normalizeBoolean(isActive);
        if (normalizedIsActive !== undefined) popup.isActive = normalizedIsActive;
        if (priority !== undefined) popup.priority = parseInt(priority);
        if (startDate !== undefined) popup.startDate = startDate || null;
        if (endDate !== undefined) popup.endDate = endDate || null;
        if (linked_offer !== undefined) popup.linked_offer = linked_offer || null;

        // Handle image update (only if new image URL is provided)
        if (image) {
            popup.image = image; // Firebase Storage URL
        }

        await popup.save();

        res.json({
            success: true,
            data: popup
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// TOGGLE active status
router.patch('/:id/toggle', async (req, res) => {
    try {
        const popup = await OfferPopup.findById(req.params.id);

        if (!popup) {
            return res.status(404).json({
                success: false,
                error: 'Offer popup not found'
            });
        }

        popup.isActive = !popup.isActive;
        await popup.save();

        res.json({
            success: true,
            data: popup
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE popup
router.delete('/:id', async (req, res) => {
    try {
        const popup = await OfferPopup.findById(req.params.id);

        if (!popup) {
            return res.status(404).json({
                success: false,
                error: 'Offer popup not found'
            });
        }

        // Note: Image deletion from Firebase Storage is handled in the frontend server action
        // This is because Firebase Admin SDK requires additional setup for storage operations

        await OfferPopup.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Offer popup deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;