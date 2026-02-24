const Coupon = require('../models/Coupon');

class CouponValidationService {
  
  /**
   * Validate coupon data before saving
   * @param {Object} couponData - Coupon data to validate
   * @param {String} adminId - Admin user ID
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  static async validateCouponData(couponData, adminId) {
    const errors = [];

    try {
      // Basic required fields
      if (!couponData.code) {
        errors.push('Coupon code is required');
      } else if (!/^[A-Z0-9]{3,20}$/.test(couponData.code.toUpperCase())) {
        errors.push('Coupon code must be 3-20 characters, uppercase letters and numbers only');
      }

      if (!couponData.campaign_name || couponData.campaign_name.trim().length === 0) {
        errors.push('Campaign name is required');
      }

      if (couponData.campaign_name && couponData.campaign_name.length > 100) {
        errors.push('Campaign name cannot exceed 100 characters');
      }

      // Date validations
      if (!couponData.start_date || !couponData.end_date) {
        errors.push('Start date and end date are required');
      } else {
        const startDate = new Date(couponData.start_date);
        const endDate = new Date(couponData.end_date);
        const now = new Date();

        if (endDate <= startDate) {
          errors.push('End date must be after start date');
        }

        // Minimum duration check (1 hour)
        const minDuration = 60 * 60 * 1000; // 1 hour in milliseconds
        if ((endDate - startDate) < minDuration) {
          errors.push('Coupon duration must be at least 1 hour');
        }

        // Start date cannot be in the past for new coupons
        if (startDate < now) {
          errors.push('Start date cannot be in the past');
        }
      }

      // Discount validations
      if (!couponData.discount_type || !['percentage', 'flat'].includes(couponData.discount_type)) {
        errors.push('Discount type must be either percentage or flat');
      }

      if (!couponData.discount_value || couponData.discount_value <= 0) {
        errors.push('Discount value must be greater than 0');
      } else {
        if (couponData.discount_type === 'percentage') {
          if (couponData.discount_value > 100) {
            errors.push('Percentage discount cannot exceed 100%');
          }
          
          if (!couponData.max_discount || couponData.max_discount <= 0) {
            errors.push('Max discount is required for percentage coupons');
          } else {
            // Validate max_discount logic
            const minPurchase = couponData.min_purchase || 0;
            const maxPossibleDiscount = (minPurchase * couponData.discount_value) / 100;
            if (couponData.max_discount < maxPossibleDiscount) {
              errors.push(`max_discount (${couponData.max_discount}) must be >= ${maxPossibleDiscount.toFixed(2)} for ${couponData.discount_value}% discount on min_purchase ${minPurchase}`);
            }
          }
        }
      }

      // Purchase amount validations
      if (couponData.min_purchase < 0) {
        errors.push('Minimum purchase cannot be negative');
      }

      if (couponData.max_purchase !== undefined) {
        if (couponData.max_purchase < 0) {
          errors.push('Maximum purchase cannot be negative');
        }
        if (couponData.max_purchase <= couponData.min_purchase) {
          errors.push('Maximum purchase must be greater than minimum purchase');
        }
      }

      // Usage limit validations
      if (!couponData.usage_limit && !couponData.limit_per_user) {
        errors.push('At least one usage limiter (usage_limit or limit_per_user) must be specified');
      }

      if (couponData.usage_limit && couponData.usage_limit < 1) {
        errors.push('Usage limit must be at least 1');
      }

      if (couponData.limit_per_user && couponData.limit_per_user < 1) {
        errors.push('Per-user limit must be at least 1');
      }

      // Applicability scope validations
      if (!couponData.applicable_on || !['cart', 'product', 'category', 'variant', 'shipping'].includes(couponData.applicable_on)) {
        errors.push('Applicable on must be one of: cart, product, category, variant, shipping');
      }

      if (!couponData.applicable_scope || !['all', 'selected'].includes(couponData.applicable_scope)) {
        errors.push('Applicable scope must be either all or selected');
      }

      // Validate applicability arrays when scope is 'selected'
      if (couponData.applicable_scope === 'selected') {
        if (couponData.applicable_on === 'category' && (!couponData.applicable_categories || couponData.applicable_categories.length === 0)) {
          errors.push('applicable_categories cannot be empty when applicable_scope is selected and applicable_on is category');
        }
        if (couponData.applicable_on === 'product' && (!couponData.applied_products || couponData.applied_products.length === 0)) {
          errors.push('applied_products cannot be empty when applicable_scope is selected and applicable_on is product');
        }
        if (couponData.applicable_on === 'variant' && (!couponData.applied_variants || couponData.applied_variants.length === 0)) {
          errors.push('applied_variants cannot be empty when applicable_scope is selected and applicable_on is variant');
        }
      }

      // Priority validation for non-stackable coupons
      if (couponData.is_stackable === false && (couponData.priority === undefined || couponData.priority < 0)) {
        errors.push('Priority is required when coupon is not stackable');
      }

      // Check for duplicate coupon code
      if (couponData.code) {
        const existingCoupon = await Coupon.findOne({ 
          code: couponData.code.toUpperCase(),
          _id: { $ne: couponData._id } // Exclude current coupon if updating
        });
        if (existingCoupon) {
          errors.push('Coupon code already exists');
        }
      }

      // Timezone validation
      if (couponData.timezone && !/^([A-Za-z_]+\/[A-Za-z_]+)$/.test(couponData.timezone)) {
        errors.push('Invalid timezone format');
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      return {
        isValid: false,
        errors: ['Validation error: ' + error.message]
      };
    }
  }

  /**
   * Validate coupon update data
   * @param {String} couponId - Coupon ID to update
   * @param {Object} updateData - Update data
   * @param {String} adminId - Admin user ID
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  static async validateCouponUpdate(couponId, updateData, adminId) {
    const errors = [];

    try {
      // Check if coupon exists
      const existingCoupon = await Coupon.findById(couponId);
      if (!existingCoupon) {
        errors.push('Coupon not found');
        return { isValid: false, errors };
      }

      // Prevent changing code if coupon has been used
      if (updateData.code && updateData.code !== existingCoupon.code && existingCoupon.used_count > 0) {
        errors.push('Cannot change coupon code after it has been used');
      }

      // Validate the update data using the same validation as create
      const validation = await this.validateCouponData(
        { ...existingCoupon.toObject(), ...updateData, _id: couponId },
        adminId
      );

      return validation;

    } catch (error) {
      return {
        isValid: false,
        errors: ['Update validation error: ' + error.message]
      };
    }
  }

  /**
   * Check if admin has permission to manage coupons
   * @param {String} adminId - Admin user ID
   * @param {String} permission - Permission level
   * @returns {Boolean}
   */
  static hasAdminPermission(adminId, permission = 'manage_coupons') {
    // This would integrate with your admin permission system
    // For now, return true (implement based on your auth system)
    return true;
  }
}

module.exports = CouponValidationService;
