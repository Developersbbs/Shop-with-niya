const router = require('express').Router();
const ComboOffer = require('../models/ComboOffer');
const Product = require('../models/Product');
const Stock = require('../models/Stock');

// GET all active combo offers (for homepage) - enhanced with filtering
router.get('/', async (req, res) => {
    try {
        const now = new Date();
        const offers = await ComboOffer.find({
            isActive: true,
            showOnHomepage: true,
            $or: [
                { startDate: null },
                { startDate: { $lte: now } }
            ],
            $or: [
                { endDate: null },
                { endDate: { $gte: now } }
            ]
        })
            .sort({ displayPriority: -1, order: 1 })
            .populate('products.productId')
            .limit(4);

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

// GET combo offers for offers page
router.get('/offers-page', async (req, res) => {
    try {
        const now = new Date();
        const offers = await ComboOffer.find({
            isActive: true,
            showOnOffersPage: true,
            $or: [
                { startDate: null },
                { startDate: { $lte: now } }
            ],
            $or: [
                { endDate: null },
                { endDate: { $gte: now } }
            ]
        })
            .populate('products.productId')
            .sort({ displayPriority: -1, order: 1 });

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

// GET all combo offers (for admin)
router.get('/admin', async (req, res) => {
    try {
        const offers = await ComboOffer.find()
            .populate('productId')
            .sort({ displayPriority: -1, order: 1, createdAt: -1 });

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

// GET combo products (for products API)
// Note: This route is deprecated since we're not creating combo products in the products collection
// Combo offers are managed separately through the ComboOffer model
router.get('/products', async (req, res) => {
    try {
        // Return empty array since we're not creating combo products
        // Combo offers should be queried through the main combo offers routes
        res.json({
            success: true,
            data: [],
            message: 'Combo products are managed through ComboOffer model'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET single combo offer by ID
router.get('/:id', async (req, res) => {
    try {
        const offer = await ComboOffer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                error: 'Combo offer not found'
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

// Helper function to transform products for updates
async function transformComboProducts(products) {
    let createdItems = [];
    try {
        console.log('Creating combo items for new products in update...');
        createdItems = await createComboItems(products);
        console.log('Created combo items for update:', createdItems.length);
    } catch (itemsError) {
        console.error('Error creating combo items for update:', itemsError);
        throw new Error('Failed to create combo items: ' + itemsError.message);
    }

    // Transform products array to match ComboOffer schema
    const transformedProducts = products.map(product => {
        // Find the created item for new products
        const createdItem = createdItems.find(item =>
            item.originalData.name === product.name && item.originalData.type === 'new'
        );

        return {
            productId: product.type === 'existing' ? product.productId : (createdItem ? createdItem.productId.toString() : undefined),
            quantity: product.quantity
        };
    });

    console.log('Transformed products for ComboOffer update:', transformedProducts);
    return transformedProducts;
}

// Helper function to create combo items (individual products) for combo offers
async function createComboItems(products) {
    const createdItems = [];
    for (const product of products) {
        if (product.type === 'new') {
            console.log('Creating new combo item product for:', product.name);

            const newProduct = new Product({
                name: product.name,
                slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
                description: `Combo item: ${product.name}`,
                product_nature: 'combo', // Combo items have combo nature
                product_structure: 'simple', // Combo items are always simple
                sku: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                cost_price: product.basePrice || 0,
                selling_price: product.basePrice || 0,
                baseStock: product.stock || 0, // Add stock for combo items
                minStock: 0, // Add minStock for combo items
                categories: [],
                image_url: product.thumbnail ? [product.thumbnail] : [],
                seo: {
                    robots: 'noindex,nofollow', // Combo items should not be indexed
                    canonical: null // No canonical URL for combo items
                }
            });

            console.log('Product data before save:', JSON.stringify(newProduct.toObject(), null, 2));
            await newProduct.save();
            console.log('Product data after save:', JSON.stringify(newProduct.toObject(), null, 2));

            // Create stock entry for the new combo item product
            try {
                const stockEntry = new Stock({
                    productId: newProduct._id,
                    variantId: null, // null for base product stock
                    quantity: product.stock || 0,
                    minStock: 0,
                    notes: `Initial stock for combo item: ${product.name}`
                });
                await stockEntry.save();
                console.log('Stock entry created for combo item:', newProduct._id);
            } catch (stockError) {
                console.error('Error creating stock entry for combo item:', stockError);
                // Don't fail the whole process if stock creation fails, but log it
            }

            createdItems.push({
                productId: newProduct._id,
                originalData: product
            });

            console.log('Created new combo item product:', newProduct._id);
        }
    }
    return createdItems;
}

// Helper function to delete combo product
async function deleteComboProduct(productId) {
    try {
        if (productId) {
            await Product.findByIdAndDelete(productId);
        }
    } catch (error) {
        console.error('Error deleting combo product:', error);
        throw error;
    }
}

// CREATE new combo offer
router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            originalPrice,
            isLimitedTime,
            order,
            isActive,
            badgeType,
            showOnHomepage,
            showOnOffersPage,
            startDate,
            endDate,
            displayPriority,
            comboImage,
            products
        } = req.body;

        // Required field validation
        if (!title || !description || price === undefined || originalPrice === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Title, description, price, and original price are required'
            });
        }

        // Price validation
        if (price < 0 || originalPrice < 0) {
            return res.status(400).json({
                success: false,
                error: 'Prices must be positive numbers'
            });
        }

        if (price > originalPrice) {
            return res.status(400).json({
                success: false,
                error: 'Discounted price cannot be greater than original price'
            });
        }

        // Date validation
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({
                success: false,
                error: 'Start date cannot be after end date'
            });
        }

        // Products validation
        if (products && (!Array.isArray(products) || products.length === 0)) {
            return res.status(400).json({
                success: false,
                error: 'At least one product must be included in the combo'
            });
        }

        // Create combo items (individual products) if needed
        let createdItems = [];
        try {
            console.log('Creating combo items for new products...');
            createdItems = await createComboItems(products);
            console.log('Created combo items:', createdItems.length);
        } catch (itemsError) {
            console.error('Error creating combo items:', itemsError);
            return res.status(500).json({
                success: false,
                error: 'Failed to create combo items: ' + itemsError.message
            });
        }

        // Create the ComboOffer document (no need to create combo product in products collection)
        console.log('Creating combo offer document...');

        // Transform products array to match ComboOffer schema
        const transformedProducts = products.map(product => {
            // Find the created item for new products
            const createdItem = createdItems.find(item =>
                item.originalData.name === product.name && item.originalData.type === 'new'
            );

            return {
                productId: product.type === 'existing' ? product.productId : (createdItem ? createdItem.productId.toString() : undefined),
                quantity: product.quantity
            };
        });

        console.log('Transformed products for ComboOffer:', transformedProducts);

        const offer = new ComboOffer({
            title,
            description,
            price,
            originalPrice,
            isLimitedTime: isLimitedTime !== undefined ? isLimitedTime : true,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true,
            badgeType: badgeType || 'LIMITED_TIME',
            showOnHomepage: showOnHomepage !== undefined ? showOnHomepage : true,
            showOnOffersPage: showOnOffersPage !== undefined ? showOnOffersPage : true,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            displayPriority: displayPriority !== undefined ? displayPriority : 0,
            comboImage: (comboImage && typeof comboImage === 'string' && comboImage.trim() !== '') ? comboImage : null,
            products: transformedProducts
            // No productId since we're not creating a combo product
        });

        console.log('Saving combo offer...');
        try {
            await offer.save();
            console.log('Combo offer saved successfully:', offer._id);
        } catch (saveError) {
            console.error('Error saving combo offer:', saveError);
            throw saveError;
        }

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

// UPDATE combo offer
router.put('/:id', async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            originalPrice,
            isLimitedTime,
            order,
            isActive,
            badgeType,
            showOnHomepage,
            showOnOffersPage,
            startDate,
            endDate,
            displayPriority,
            comboImage,
            products
        } = req.body;

        // Validate prices if provided
        if (price !== undefined && price < 0) {
            return res.status(400).json({
                success: false,
                error: 'Price must be a positive number'
            });
        }

        if (originalPrice !== undefined && originalPrice < 0) {
            return res.status(400).json({
                success: false,
                error: 'Original price must be a positive number'
            });
        }

        // Date validation if both provided
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({
                success: false,
                error: 'Start date cannot be after end date'
            });
        }

        // Products validation if provided
        if (products && (!Array.isArray(products) || products.length === 0)) {
            return res.status(400).json({
                success: false,
                error: 'At least one product must be included in the combo'
            });
        }

        // Transform products array if provided
        let transformedProducts = undefined;
        if (products !== undefined) {
            transformedProducts = await transformComboProducts(products);
        }

        // Build update object with only provided fields
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = price;
        if (originalPrice !== undefined) updateData.originalPrice = originalPrice;
        if (isLimitedTime !== undefined) updateData.isLimitedTime = isLimitedTime;
        if (order !== undefined) updateData.order = order;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (badgeType !== undefined) updateData.badgeType = badgeType;
        if (showOnHomepage !== undefined) updateData.showOnHomepage = showOnHomepage;
        if (showOnOffersPage !== undefined) updateData.showOnOffersPage = showOnOffersPage;
        if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (displayPriority !== undefined) updateData.displayPriority = displayPriority;
        if (comboImage !== undefined) updateData.comboImage = comboImage;
        if (transformedProducts !== undefined) updateData.products = transformedProducts;

        // Get existing combo offer
        const existingOffer = await ComboOffer.findById(req.params.id);
        if (!existingOffer) {
            return res.status(404).json({
                success: false,
                error: 'Combo offer not found'
            });
        }

        // Update the combo offer (no combo product to update)
        const offer = await ComboOffer.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!offer) {
            return res.status(404).json({
                success: false,
                error: 'Combo offer not found'
            });
        }

        // Validate that price is not greater than originalPrice
        if (offer.price > offer.originalPrice) {
            return res.status(400).json({
                success: false,
                error: 'Discounted price cannot be greater than original price'
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

// DELETE combo offer
router.delete('/:id', async (req, res) => {
    try {
        const offer = await ComboOffer.findByIdAndDelete(req.params.id);

        if (!offer) {
            return res.status(404).json({
                success: false,
                error: 'Combo offer not found'
            });
        }

        // Note: Individual combo item products are not deleted
        // They remain in the products collection as normal products

        res.json({
            success: true,
            message: 'Combo offer deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;