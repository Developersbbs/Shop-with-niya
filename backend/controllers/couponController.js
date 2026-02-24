const Coupon = require('../models/Coupon');
const CouponValidationService = require('../services/couponValidation');
const CouponApplicationService = require('../services/couponApplication');

class CouponController {
  
  /**
   * Create a new coupon
   */
  static async createCoupon(req, res) {
    try {
      const { adminId } = req.user;
      const couponData = { ...req.body, created_by: adminId };

      // Validate admin permissions
      if (!CouponValidationService.hasAdminPermission(adminId, 'create_coupons')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to create coupons'
        });
      }

      // Validate coupon data
      const validation = await CouponValidationService.validateCouponData(couponData, adminId);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Create coupon
      const coupon = new Coupon(couponData);
      await coupon.save();

      res.status(201).json({
        success: true,
        message: 'Coupon created successfully',
        data: coupon
      });

    } catch (error) {
      console.error('Error creating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating coupon',
        error: error.message
      });
    }
  }

  /**
   * Update an existing coupon
   */
  static async updateCoupon(req, res) {
    try {
      const { id } = req.params;
      const { adminId } = req.user;
      const updateData = req.body;

      // Validate admin permissions
      if (!CouponValidationService.hasAdminPermission(adminId, 'update_coupons')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to update coupons'
        });
      }

      // Validate update data
      const validation = await CouponValidationService.validateCouponUpdate(id, updateData, adminId);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
      }

      // Update coupon
      const coupon = await Coupon.findByIdAndUpdate(
        id,
        { ...updateData, updated_at: new Date() },
        { new: true, runValidators: true }
      );

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      res.json({
        success: true,
        message: 'Coupon updated successfully',
        data: coupon
      });

    } catch (error) {
      console.error('Error updating coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating coupon',
        error: error.message
      });
    }
  }

  /**
   * Delete a coupon
   */
  static async deleteCoupon(req, res) {
    try {
      const { id } = req.params;
      const { adminId } = req.user;

      // Validate admin permissions
      if (!CouponValidationService.hasAdminPermission(adminId, 'delete_coupons')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to delete coupons'
        });
      }

      const coupon = await Coupon.findById(id);
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      // Prevent deletion if coupon has been used
      if (coupon.used_count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete coupon that has been used. Consider deactivating it instead.'
        });
      }

      await Coupon.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Coupon deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting coupon',
        error: error.message
      });
    }
  }

  /**
   * Get all coupons with pagination and filtering
   */
  static async getCoupons(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        discount_type,
        search,
        sort = 'created_at',
        order = 'desc'
      } = req.query;

      const query = {};

      // Build filter query
      if (status) {
        if (status === 'active') {
          query.is_active = true;
          query.published = true;
        } else if (status === 'inactive') {
          query.is_active = false;
        } else if (status === 'expired') {
          query.end_date = { $lt: new Date() };
        }
      }

      if (discount_type) {
        query.discount_type = discount_type;
      }

      if (search) {
        query.$or = [
          { code: { $regex: search, $options: 'i' } },
          { campaign_name: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort object
      const sortObj = {};
      sortObj[sort] = order === 'desc' ? -1 : 1;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [coupons, total] = await Promise.all([
        Coupon.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit))
          .populate('applicable_categories.category', 'name')
          .populate('applied_products', 'name')
          .populate('applied_variants', 'name'),
        Coupon.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          coupons,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Error getting coupons:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching coupons',
        error: error.message
      });
    }
  }

  /**
   * Get a single coupon by ID
   */
  static async getCouponById(req, res) {
    try {
      const { id } = req.params;

      const coupon = await Coupon.findById(id)
        .populate('applicable_categories.category', 'name')
        .populate('applicable_categories.subcategories', 'name')
        .populate('applied_products', 'name')
        .populate('applied_variants', 'name');

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      res.json({
        success: true,
        data: coupon
      });

    } catch (error) {
      console.error('Error getting coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching coupon',
        error: error.message
      });
    }
  }

  /**
   * Apply coupon to cart (frontend endpoint)
   */
  static async applyCoupon(req, res) {
    try {
      const { couponCode } = req.body;
      const { userId } = req.user;
      const { cart, user } = req.body; // These should come from request body or middleware

      if (!couponCode) {
        return res.status(400).json({
          success: false,
          message: 'Coupon code is required'
        });
      }

      // Validate coupon code
      const validation = await CouponApplicationService.validateCouponCode(
        couponCode,
        userId,
        cart,
        user
      );

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.reason
        });
      }

      // Apply coupon and get best combination
      const result = await CouponApplicationService.applyBestCoupons(
        userId,
        cart,
        user,
        [couponCode]
      );

      res.json({
        success: true,
        message: 'Coupon applied successfully',
        data: result
      });

    } catch (error) {
      console.error('Error applying coupon:', error);
      res.status(500).json({
        success: false,
        message: 'Error applying coupon',
        error: error.message
      });
    }
  }

  /**
   * Get applicable coupons for user
   */
  static async getApplicableCoupons(req, res) {
    try {
      const { userId } = req.user;
      const { cart, user } = req.body;

      const applicableCoupons = await CouponApplicationService.findApplicableCoupons(
        userId,
        cart,
        user
      );

      res.json({
        success: true,
        data: applicableCoupons
      });

    } catch (error) {
      console.error('Error getting applicable coupons:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching applicable coupons',
        error: error.message
      });
    }
  }

  /**
   * Record coupon usage after order completion
   */
  static async recordCouponUsage(req, res) {
    try {
      const { appliedCoupons, orderId, originalTotal, finalTotal } = req.body;
      const { userId } = req.user;

      if (!appliedCoupons || !Array.isArray(appliedCoupons)) {
        return res.status(400).json({
          success: false,
          message: 'Applied coupons array is required'
        });
      }

      const success = await CouponApplicationService.recordCouponUsage(
        appliedCoupons,
        userId,
        orderId,
        originalTotal,
        finalTotal
      );

      if (success) {
        res.json({
          success: true,
          message: 'Coupon usage recorded successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error recording coupon usage'
        });
      }

    } catch (error) {
      console.error('Error recording coupon usage:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording coupon usage',
        error: error.message
      });
    }
  }

  /**
   * Get coupon analytics
   */
  static async getCouponAnalytics(req, res) {
    try {
      const { id } = req.params;

      const coupon = await Coupon.findById(id).select('analytics usage_history');
      
      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: 'Coupon not found'
        });
      }

      res.json({
        success: true,
        data: {
          analytics: coupon.analytics,
          usage_history: coupon.usage_history,
          usage_summary: {
            total_usage: coupon.usage_history.length,
            unique_users: [...new Set(coupon.usage_history.map(u => u.user_id))].length,
            total_discount: coupon.analytics.total_discount_given,
            conversion_rate: coupon.analytics.conversion_rate
          }
        }
      });

    } catch (error) {
      console.error('Error getting coupon analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching coupon analytics',
        error: error.message
      });
    }
  }

  /**
   * Bulk update coupon status
   */
  static async bulkUpdateStatus(req, res) {
    try {
      const { couponIds, status } = req.body;
      const { adminId } = req.user;

      if (!CouponValidationService.hasAdminPermission(adminId, 'bulk_update_coupons')) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions for bulk updates'
        });
      }

      if (!couponIds || !Array.isArray(couponIds) || couponIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Coupon IDs array is required'
        });
      }

      const updateData = {};
      if (status === 'activate') {
        updateData.is_active = true;
        updateData.published = true;
      } else if (status === 'deactivate') {
        updateData.is_active = false;
      } else if (status === 'unpublish') {
        updateData.published = false;
      }

      const result = await Coupon.updateMany(
        { _id: { $in: couponIds } },
        { ...updateData, updated_at: new Date() }
      );

      res.json({
        success: true,
        message: `Updated ${result.modifiedCount} coupons successfully`,
        data: {
          modifiedCount: result.modifiedCount
        }
      });

    } catch (error) {
      console.error('Error in bulk status update:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating coupons',
        error: error.message
      });
    }
  }
}

module.exports = CouponController;
