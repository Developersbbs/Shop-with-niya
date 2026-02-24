const express = require('express');
const router = express.Router();
const HeroSection = require('../models/HeroSection');
const firebaseAdmin = require('../lib/firebase');

// GET all active slides (Public)
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const query = {
            isActive: true,
            isArchived: { $ne: true },
            $or: [
                { startDate: { $exists: false } },
                { startDate: { $lte: now } }
            ],
            $or: [
                { endDate: { $exists: false } },
                { endDate: { $gte: now } }
            ]
        };
        
        // Optional device targeting filter
        if (req.query.device) {
            const device = req.query.device.toLowerCase();
            query.showOn = { $in: ['all', device] };
        }
        
        const slides = await HeroSection.find(query).sort({ order: 1 });
        res.json({ success: true, data: slides });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET all slides (Admin)
router.get('/admin', async (req, res) => {
    try {
        const slides = await HeroSection.find().sort({ order: 1 });
        res.json({ success: true, data: slides });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST new slide
router.post('/', async (req, res) => {
    try {
        const { 
            title, 
            subtitle, 
            description, 
            image, 
            imageMobile,
            primaryCTA,
            secondaryCTA,
            gradient, 
            isActive,
            order,
            startDate,
            endDate,
            templateType,
            showOn,
            isArchived
        } = req.body;

        // Validate required fields
        if (!title || !image) {
            return res.status(400).json({ 
                success: false, 
                error: 'Title and image are required',
                errors: {
                    title: !title ? ['Title is required'] : [],
                    image: !image ? ['Image is required'] : []
                }
            });
        }

        // Get highest order to append to end
        const lastSlide = await HeroSection.findOne().sort({ order: -1 });
        const newOrder = lastSlide ? lastSlide.order + 1 : 0;

        const newSlide = new HeroSection({
            title: title.trim(),
            subtitle: subtitle || '',
            description: description || '',
            image: image.trim(), // Firebase Storage URL
            imageMobile: imageMobile ? imageMobile.trim() : undefined,
            primaryCTA: primaryCTA,
            secondaryCTA: secondaryCTA,
            gradient: gradient || 'from-black/90 via-black/40 to-transparent',
            order: order !== undefined ? parseInt(order) : newOrder,
            isActive: isActive !== undefined ? isActive === true || isActive === 'true' : true,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            templateType: templateType || 'center',
            showOn: showOn || 'all',
            isArchived: isArchived === true || isArchived === 'true'
        });

        await newSlide.save();
        res.status(201).json({ success: true, data: newSlide });
    } catch (err) {
        console.error('Error creating hero section:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT update slide
router.put('/:id', async (req, res) => {
    try {
        const { 
            title, 
            subtitle, 
            description, 
            image, 
            imageMobile,
            primaryCTA,
            secondaryCTA,
            gradient, 
            isActive, 
            order,
            startDate,
            endDate,
            templateType,
            showOn,
            isArchived
        } = req.body;
        const updateData = {};

        // Only update fields that are provided
        if (title !== undefined) {
            if (!title || title.trim() === '') {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Title is required',
                    errors: { title: ['Title is required'] }
                });
            }
            updateData.title = title.trim();
        }
        
        if (subtitle !== undefined) updateData.subtitle = subtitle || '';
        if (description !== undefined) updateData.description = description || '';
        if (image !== undefined) updateData.image = image.trim(); // Firebase Storage URL
        if (imageMobile !== undefined) updateData.imageMobile = imageMobile ? imageMobile.trim() : undefined;
        if (primaryCTA !== undefined) updateData.primaryCTA = primaryCTA;
        if (secondaryCTA !== undefined) updateData.secondaryCTA = secondaryCTA;
        if (gradient !== undefined) updateData.gradient = gradient || 'from-black/90 via-black/40 to-transparent';
        if (isActive !== undefined) updateData.isActive = isActive === true || isActive === 'true';
        if (order !== undefined) updateData.order = parseInt(order) || 0;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : undefined;
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : undefined;
        if (templateType !== undefined) updateData.templateType = templateType;
        if (showOn !== undefined) updateData.showOn = showOn;
        if (isArchived !== undefined) updateData.isArchived = isArchived === true || isArchived === 'true';

        const slide = await HeroSection.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!slide) {
            return res.status(404).json({ success: false, error: 'Slide not found' });
        }

        res.json({ success: true, data: slide });
    } catch (err) {
        console.error('Error updating hero section:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE slide
router.delete('/:id', async (req, res) => {
    try {
        const slide = await HeroSection.findByIdAndDelete(req.params.id);

        if (!slide) {
            return res.status(404).json({ success: false, error: 'Slide not found' });
        }

        // Note: Image deletion from Firebase Storage is handled in the frontend server action
        // This is because Firebase Admin SDK requires additional setup for storage operations

        res.json({ success: true, message: 'Slide deleted successfully' });
    } catch (err) {
        console.error('Error deleting hero section:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET single slide by ID
router.get('/:id', async (req, res) => {
    try {
        const slide = await HeroSection.findById(req.params.id);

        if (!slide) {
            return res.status(404).json({ success: false, error: 'Slide not found' });
        }

        res.json({ success: true, data: slide });
    } catch (err) {
        console.error('Error fetching hero section:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST analytics - track view
router.post('/:id/view', async (req, res) => {
    try {
        const slide = await HeroSection.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!slide) {
            return res.status(404).json({ success: false, error: 'Slide not found' });
        }

        res.json({ success: true, data: { views: slide.views } });
    } catch (err) {
        console.error('Error tracking view:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST analytics - track click
router.post('/:id/click', async (req, res) => {
    try {
        const slide = await HeroSection.findByIdAndUpdate(
            req.params.id,
            { $inc: { clicks: 1 } },
            { new: true }
        );

        if (!slide) {
            return res.status(404).json({ success: false, error: 'Slide not found' });
        }

        res.json({ success: true, data: { clicks: slide.clicks } });
    } catch (err) {
        console.error('Error tracking click:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;