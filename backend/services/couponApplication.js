const Coupon = require('../models/Coupon');

class CouponApplicationService {
  
  /**
   * Find applicable coupons for a user and cart
   * @param {String} userId - User ID
   * @param {Object} cart - Cart object with items, totals
   * @param {Object} user - User object with order history
   * @returns {Array} Array of applicable coupons
   */
  static async findApplicableCoupons(userId, cart, user) {
    try {
      const now = new Date();
      const userOrderCount = user?.orderCount || 0;

      // Find all active, published coupons
      const coupons = await Coupon.find({
        is_active: true,
        published: true,
        start_date: { $lte: now },
        end_date: { $gte: now }
      }).sort({ priority: -1 });

      const applicableCoupons = [];

      for (const coupon of coupons) {
        const eligibility = await this.checkCouponEligibility(coupon, userId, cart, userOrderCount);
        if (eligibility.isEligible) {
          const discount = this.calculateCouponDiscount(coupon, cart);
          applicableCoupons.push({
            coupon,
            discount,
            eligibility
          });
        }
      }

      return applicableCoupons;

    } catch (error) {
      console.error('Error finding applicable coupons:', error);
      return [];
    }
  }

  /**
   * Check if a coupon is eligible for a user and cart
   * @param {Object} coupon - Coupon document
   * @param {String} userId - User ID
   * @param {Object} cart - Cart object
   * @param {Number} userOrderCount - User's order count
   * @returns {Object} { isEligible: boolean, reason?: string }
   */
  static async checkCouponEligibility(coupon, userId, cart, userOrderCount = 0) {
    try {
      // Check basic validity
      if (!coupon.is_valid) {
        return { isEligible: false, reason: 'Coupon is not valid or expired' };
      }

      // Check usage limits
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return { isEligible: false, reason: 'Coupon usage limit reached' };
      }

      // Check user eligibility
      const userCanUse = coupon.canUserUse(userId, userOrderCount);
      if (!userCanUse.canUse) {
        return { isEligible: false, reason: userCanUse.reason };
      }

      // Check cart value eligibility
      const cartTotal = this.calculateCartTotal(cart);
      if (cartTotal < coupon.min_purchase) {
        return { isEligible: false, reason: `Minimum purchase of ${coupon.min_purchase} required` };
      }

      if (coupon.max_purchase && cartTotal > coupon.max_purchase) {
        return { isEligible: false, reason: `Maximum purchase limit of ${coupon.max_purchase} exceeded` };
      }

      // Check applicability scope
      const scopeCheck = this.checkApplicabilityScope(coupon, cart);
      if (!scopeCheck.isApplicable) {
        return { isEligible: false, reason: scopeCheck.reason };
      }

      return { isEligible: true };

    } catch (error) {
      console.error('Error checking coupon eligibility:', error);
      return { isEligible: false, reason: 'Error checking eligibility' };
    }
  }

  /**
   * Check if coupon applies to cart items based on scope
   * @param {Object} coupon - Coupon document
   * @param {Object} cart - Cart object
   * @returns {Object} { isApplicable: boolean, reason?: string, eligibleItems: Array }
   */
  static checkApplicabilityScope(coupon, cart) {
    try {
      const cartItems = cart.items || [];
      
      if (coupon.applicable_scope === 'all') {
        return { 
          isApplicable: true, 
          eligibleItems: cartItems 
        };
      }

      const eligibleItems = [];

      switch (coupon.applicable_on) {
        case 'cart':
          // Cart-level coupons apply to entire cart
          return { 
            isApplicable: true, 
            eligibleItems: cartItems 
          };

        case 'product':
          if (!coupon.applied_products || coupon.applied_products.length === 0) {
            return { isApplicable: false, reason: 'No products specified for coupon' };
          }
          
          for (const item of cartItems) {
            if (coupon.applied_products.includes(item.productId)) {
              eligibleItems.push(item);
            }
          }
          break;

        case 'category':
          if (!coupon.applicable_categories || coupon.applicable_categories.length === 0) {
            return { isApplicable: false, reason: 'No categories specified for coupon' };
          }
          
          for (const item of cartItems) {
            const itemCategories = item.categories || [];
            const couponCategories = coupon.applicable_categories.map(c => c.category.toString());
            
            if (itemCategories.some(cat => couponCategories.includes(cat.toString()))) {
              eligibleItems.push(item);
            }
          }
          break;

        case 'variant':
          if (!coupon.applied_variants || coupon.applied_variants.length === 0) {
            return { isApplicable: false, reason: 'No variants specified for coupon' };
          }
          
          for (const item of cartItems) {
            if (coupon.applied_variants.includes(item.variantId)) {
              eligibleItems.push(item);
            }
          }
          break;

        case 'shipping':
          // Shipping coupons apply if cart has shipping charges
          if (cart.shippingAmount > 0) {
            return { 
              isApplicable: true, 
              eligibleItems: cartItems 
            };
          }
          return { isApplicable: false, reason: 'No shipping charges in cart' };

        default:
          return { isApplicable: false, reason: 'Invalid applicability scope' };
      }

      if (eligibleItems.length === 0) {
        return { isApplicable: false, reason: 'No eligible items in cart' };
      }

      return { isApplicable: true, eligibleItems };

    } catch (error) {
      console.error('Error checking applicability scope:', error);
      return { isApplicable: false, reason: 'Error checking applicability' };
    }
  }

  /**
   * Calculate cart total from cart object
   * @param {Object} cart - Cart object
   * @returns {Number} Cart total
   */
  static calculateCartTotal(cart) {
    const items = cart.items || [];
    return items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  /**
   * Calculate eligible items total for coupon
   * @param {Object} coupon - Coupon document
   * @param {Object} cart - Cart object
   * @returns {Number} Eligible items total
   */
  static calculateEligibleTotal(coupon, cart) {
    const scopeCheck = this.checkApplicabilityScope(coupon, cart);
    if (!scopeCheck.isApplicable) {
      return 0;
    }

    return scopeCheck.eligibleItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }

  /**
   * Calculate discount amount for a coupon
   * @param {Object} coupon - Coupon document
   * @param {Object} cart - Cart object
   * @returns {Number} Discount amount
   */
  static calculateCouponDiscount(coupon, cart) {
    try {
      let eligibleTotal = this.calculateCartTotal(cart);
      
      // If coupon has specific applicability, calculate based on eligible items only
      if (coupon.applicable_on !== 'cart' && coupon.applicable_scope === 'selected') {
        eligibleTotal = this.calculateEligibleTotal(coupon, cart);
      }

      if (eligibleTotal <= 0) {
        return 0;
      }

      let discount = 0;

      if (coupon.discount_type === 'percentage') {
        discount = (eligibleTotal * coupon.discount_value) / 100;
        // Apply max discount limit
        if (coupon.max_discount && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }
      } else if (coupon.discount_type === 'flat') {
        discount = Math.min(coupon.discount_value, eligibleTotal);
      }

      return Math.max(0, discount);

    } catch (error) {
      console.error('Error calculating coupon discount:', error);
      return 0;
    }
  }

  /**
   * Apply best coupon(s) to cart
   * @param {String} userId - User ID
   * @param {Object} cart - Cart object
   * @param {Object} user - User object
   * @param {Array} selectedCouponCodes - Specific coupon codes to apply (optional)
   * @returns {Object} { appliedCoupons: Array, totalDiscount: Number, finalTotal: Number }
   */
  static async applyBestCoupons(userId, cart, user, selectedCouponCodes = []) {
    try {
      const applicableCoupons = await this.findApplicableCoupons(userId, cart, user);
      
      // Filter by selected codes if provided
      let couponsToConsider = applicableCoupons;
      if (selectedCouponCodes.length > 0) {
        couponsToConsider = applicableCoupons.filter(c => 
          selectedCouponCodes.includes(c.coupon.code)
        );
      }

      if (couponsToConsider.length === 0) {
        return {
          appliedCoupons: [],
          totalDiscount: 0,
          finalTotal: this.calculateCartTotal(cart)
        };
      }

      // Sort by priority (highest first) and then by discount amount
      couponsToConsider.sort((a, b) => {
        if (a.coupon.priority !== b.coupon.priority) {
          return b.coupon.priority - a.coupon.priority;
        }
        return b.discount - a.discount;
      });

      const appliedCoupons = [];
      let totalDiscount = 0;
      let cartCopy = JSON.parse(JSON.stringify(cart)); // Deep copy

      // Apply coupons based on stackability rules
      for (const couponData of couponsToConsider) {
        const coupon = couponData.coupon;
        
        // Check if this coupon can be stacked with already applied coupons
        if (appliedCoupons.length > 0 && !coupon.is_stackable) {
          // Check if any applied coupon is non-stackable
          const hasNonStackable = appliedCoupons.some(ac => !ac.coupon.is_stackable);
          if (hasNonStackable) {
            continue; // Skip this coupon
          }
        }

        // Check if this coupon excludes any already applied coupons
        if (coupon.excluded_coupon_ids && coupon.excluded_coupon_ids.length > 0) {
          const hasExcluded = appliedCoupons.some(ac => 
            coupon.excluded_coupon_ids.includes(ac.coupon.code)
          );
          if (hasExcluded) {
            continue; // Skip this coupon
          }
        }

        // Calculate discount on current cart state
        const discount = this.calculateCouponDiscount(coupon, cartCopy);
        
        if (discount > 0) {
          appliedCoupons.push({
            coupon,
            discount,
            code: coupon.code
          });
          totalDiscount += discount;

          // Update cart copy for next coupon calculation
          cartCopy.totalAmount = Math.max(0, cartCopy.totalAmount - discount);
        }
      }

      const finalTotal = Math.max(0, this.calculateCartTotal(cart) - totalDiscount);

      return {
        appliedCoupons,
        totalDiscount,
        finalTotal
      };

    } catch (error) {
      console.error('Error applying best coupons:', error);
      return {
        appliedCoupons: [],
        totalDiscount: 0,
        finalTotal: this.calculateCartTotal(cart)
      };
    }
  }

  /**
   * Record coupon usage after successful order
   * @param {Array} appliedCoupons - Array of applied coupons
   * @param {String} userId - User ID
   * @param {String} orderId - Order ID
   * @param {Number} originalTotal - Original cart total
   * @param {Number} finalTotal - Final order total
   * @returns {Promise} Promise that resolves when all usages are recorded
   */
  static async recordCouponUsage(appliedCoupons, userId, orderId, originalTotal, finalTotal) {
    try {
      const promises = appliedCoupons.map(async (couponData) => {
        const coupon = couponData.coupon;
        const discountAmount = couponData.discount;
        
        await coupon.recordUsage(userId, orderId, discountAmount, originalTotal, finalTotal);
      });

      await Promise.all(promises);
      return true;

    } catch (error) {
      console.error('Error recording coupon usage:', error);
      return false;
    }
  }

  /**
   * Validate coupon code before application
   * @param {String} couponCode - Coupon code to validate
   * @param {String} userId - User ID
   * @param {Object} cart - Cart object
   * @param {Object} user - User object
   * @returns {Object} { isValid: boolean, coupon?: Object, reason?: string }
   */
  static async validateCouponCode(couponCode, userId, cart, user) {
    try {
      const coupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(),
        is_active: true,
        published: true 
      });

      if (!coupon) {
        return { isValid: false, reason: 'Coupon not found or inactive' };
      }

      const eligibility = await this.checkCouponEligibility(coupon, userId, cart, user?.orderCount || 0);
      
      if (!eligibility.isEligible) {
        return { isValid: false, coupon, reason: eligibility.reason };
      }

      // Record apply attempt
      await coupon.recordAnalytics('apply_attempt');

      return { isValid: true, coupon };

    } catch (error) {
      console.error('Error validating coupon code:', error);
      return { isValid: false, reason: 'Error validating coupon' };
    }
  }
}

module.exports = CouponApplicationService;
