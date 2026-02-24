const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/couponController');

// Admin routes - require authentication and admin permissions
router.post('/', CouponController.createCoupon);
router.put('/:id', CouponController.updateCoupon);
router.delete('/:id', CouponController.deleteCoupon);
router.get('/', CouponController.getCoupons);
router.get('/:id', CouponController.getCouponById);
router.get('/:id/analytics', CouponController.getCouponAnalytics);
router.post('/bulk-update-status', CouponController.bulkUpdateStatus);

// User-facing routes
router.post('/apply', CouponController.applyCoupon);
router.post('/applicable', CouponController.getApplicableCoupons);
router.post('/record-usage', CouponController.recordCouponUsage);

module.exports = router;
