const mongoose = require('mongoose');

const heroSectionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    subtitle: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    imageMobile: {
        type: String,
        trim: true
    },
    // CTA structure
    primaryCTA: {
        text: {
            type: String,
            default: 'Shop Now'
        },
        link: {
            type: String,
            default: '/products'
        }
    },
    secondaryCTA: {
        text: {
            type: String,
            trim: true
        },
        link: {
            type: String,
            trim: true
        }
    },
    gradient: {
        type: String,
        default: 'from-black/90 via-black/40 to-transparent'
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Scheduling support
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    // Analytics tracking
    views: {
        type: Number,
        default: 0
    },
    clicks: {
        type: Number,
        default: 0
    },
    // Template type support
    templateType: {
        type: String,
        enum: ['full', 'center', 'banner', 'split'],
        default: 'center'
    },
    // Device targeting
    showOn: {
        type: String,
        enum: ['all', 'desktop', 'mobile'],
        default: 'all'
    },
    // Soft delete / archive
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('HeroSection', heroSectionSchema);