const mongoose = require('mongoose');

const comboOfferSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    isLimitedTime: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // New fields for enhanced functionality
    badgeType: {
        type: String,
        enum: ['LIMITED_TIME', 'BEST_VALUE', 'HOT_SALE'],
        default: 'LIMITED_TIME'
    },
    showOnHomepage: {
        type: Boolean,
        default: true
    },
    showOnOffersPage: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    displayPriority: {
        type: Number,
        default: 0,
        min: 0
    },
    comboImage: {
        type: String, // Store image URL/path
        default: null
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        }
    }],
    // Reference to the corresponding Product document
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }
}, {
    timestamps: true
});

// Virtual field for savings percentage
comboOfferSchema.virtual('savingsPercent').get(function () {
    if (this.originalPrice > 0) {
        return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
    }
    return 0;
});

// Ensure virtuals are included in JSON
comboOfferSchema.set('toJSON', { virtuals: true });
comboOfferSchema.set('toObject', { virtuals: true });

// Index for efficient querying
comboOfferSchema.index({ order: 1, isActive: 1, displayPriority: 1 });
comboOfferSchema.index({ showOnHomepage: 1, isActive: 1 });
comboOfferSchema.index({ showOnOffersPage: 1, isActive: 1 });
comboOfferSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

module.exports = mongoose.model('ComboOffer', comboOfferSchema);