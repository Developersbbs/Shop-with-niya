import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { cartAPI } from '../services/cartService';
import toast from 'react-hot-toast';
import {
  getGuestCart,
  addToGuestCart,
  removeFromGuestCart,
  updateGuestCartQuantity,
  clearGuestCart,
  getGuestDataForMigration,
  clearAllGuestData,
  isInGuestCart,
  getGuestCartCount
} from '../utils/guestStorage';

const CartContext = createContext();

const CART_ACTIONS = {
  SET_CART: 'SET_CART',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_LOADING: 'SET_LOADING'
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        items: action.payload,
        itemCount: action.payload.reduce((total, item) => total + item.quantity, 0),
        loading: false
      };
    case CART_ACTIONS.ADD_ITEM:
      return {
        ...state,
        items: action.payload,
        itemCount: action.payload.reduce((total, item) => total + item.quantity, 0)
      };
    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: action.payload,
        itemCount: action.payload.reduce((total, item) => total + item.quantity, 0)
      };
    case CART_ACTIONS.UPDATE_QUANTITY:
      return {
        ...state,
        items: action.payload,
        itemCount: action.payload.reduce((total, item) => total + item.quantity, 0)
      };
    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        itemCount: 0
      };
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

const initialState = {
  items: [],
  itemCount: 0,
  loading: true
};

const transformCartItems = (items) =>
  items
    .filter(item => item.product_id != null)
    .map(item => {
      const populatedProduct = item.product_id && typeof item.product_id === 'object'
        ? item.product_id
        : null;

      const matchedVariant = item.variant_id && populatedProduct?.product_variants
        ? populatedProduct.product_variants.find(
            v => String(v._id) === String(item.variant_id)
          )
        : null;

      // Variant product → read variant stock; Simple product → read baseStock
      const stock = item.variant_id
        ? (matchedVariant?.stock ?? 0)
        : (populatedProduct?.baseStock ?? 0);

      // ✅ FIX 1: variant tax takes priority over product-level tax
      const taxRate = (
        matchedVariant?.tax_percentage   // variant tax wins
        ?? item.tax_percentage           // fallback to stored cart value
        ?? populatedProduct?.tax_percentage // fallback to product
        ?? 0
      ) / 100;

      return {
        id: populatedProduct?._id || item.product_id,
        cartItemId: item._id,
        name: item.product_name || populatedProduct?.name || 'Unknown Product',
        price: item.price || populatedProduct?.selling_price || 0,
        quantity: item.quantity || 1,
        image: item.product_image || populatedProduct?.image_url?.[0] || null,
        variant: item.variant_attributes || {},
        variant_id: item.variant_id || null,
        stock: stock,
        taxRate: taxRate,
        // ✅ also expose tax_percentage for CheckoutPage calculations
        tax_percentage: taxRate * 100,
        slug: populatedProduct?.slug || null
      };
    });

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, loading: authLoading, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    window.__CURRENT_USER__ = user;
  }, [user]);

  useEffect(() => {
    if (!user || !user.uid) {
      const guestCart = getGuestCart();
      dispatch({ type: CART_ACTIONS.SET_CART, payload: guestCart });
      console.log('CartContext: Loaded guest cart with', guestCart.length, 'items');
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (user && user.uid && isAuthenticated) {
      const loadTimer = setTimeout(() => {
        if (user && user.uid && isAuthenticated) {
          handleUserLogin();
        }
      }, 500);
      return () => clearTimeout(loadTimer);
    } else {
      const guestCart = getGuestCart();
      dispatch({ type: CART_ACTIONS.SET_CART, payload: guestCart });
    }
  }, [user, authLoading, isAuthenticated]);

  useEffect(() => {
    const handleAuthUserRestored = () => {
      if (user && user.uid && isAuthenticated) {
        handleUserLogin();
      }
    };
    window.addEventListener('auth:user-restored', handleAuthUserRestored);
    return () => window.removeEventListener('auth:user-restored', handleAuthUserRestored);
  }, [user, isAuthenticated]);

  const handleUserLogin = async (retryCount = 0) => {
    if (!user || !user.uid) return;

    dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

    try {
      const guestCart = getGuestCart();
      const backendCart = await cartAPI.getCart();

      if (backendCart.success && backendCart.data?.items?.length > 0) {
        const transformedItems = transformCartItems(backendCart.data.items);
        dispatch({ type: CART_ACTIONS.SET_CART, payload: transformedItems });

        if (guestCart.length > 0) {
          await migrateGuestCartItems(guestCart);
        }
      } else {
        if (guestCart.length > 0) {
          await migrateGuestCartItems(guestCart);
        } else {
          dispatch({ type: CART_ACTIONS.CLEAR_CART });
        }
      }
    } catch (error) {
      console.error('Error loading cart from MongoDB:', error);

      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        if (retryCount === 0) {
          setTimeout(() => handleUserLogin(1), 1000);
          return;
        } else {
          toast.error('Please login again to access your cart');
        }
      } else {
        if (retryCount === 0) {
          setTimeout(() => handleUserLogin(1), 500);
          return;
        } else {
          toast.error('Failed to load cart data');
        }
      }
      dispatch({ type: CART_ACTIONS.CLEAR_CART });
    } finally {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const migrateGuestCartItems = async (guestCartItems) => {
    try {
      let migratedCount = 0;

      for (const guestItem of guestCartItems) {
        try {
          const cartItem = {
            product_id: guestItem.id,
            variant_id: guestItem.variant_id || null,
            quantity: guestItem.quantity,
            price: guestItem.price,
            discounted_price: guestItem.price,
            product_name: guestItem.name,
            product_image: guestItem.image,
            variant_attributes: guestItem.variant || {},
            tax_percentage: guestItem.taxRate ? guestItem.taxRate * 100 : 0,
            stock: guestItem.stock ?? 999
          };

          const response = await cartAPI.addToCart(cartItem);
          if (response.success) migratedCount++;
        } catch (error) {
          console.error('Failed to migrate guest cart item:', guestItem.name, error);
        }
      }

      if (migratedCount > 0) {
        const backendCart = await cartAPI.getCart();
        if (backendCart.success && backendCart.data?.items) {
          const transformedItems = transformCartItems(backendCart.data.items);
          dispatch({ type: CART_ACTIONS.SET_CART, payload: transformedItems });
          clearGuestCart();
        }
        toast.success(`${migratedCount} items moved to your cart`);
      } else {
        clearGuestCart();
      }
    } catch (error) {
      console.error('Error during guest cart migration:', error);
    }
  };

  const addToCart = async (product, variant = null, quantity = 1) => {
    try {
      if (user && user.uid) {
        const basePrice = variant?.selling_price || product.selling_price || product.price || product.mrp || 1;
        const discountedPrice = variant?.selling_price || product.salePrice || product.selling_price || product.price || product.mrp || basePrice;

        // ✅ FIX 2: use variant tax if available, fallback to product tax
        const taxPercentage = variant?.tax_percentage ?? product.tax_percentage ?? 0;

        const stock = variant ? (variant.stock ?? 0) : (product.baseStock ?? 0);

        const cartItem = {
          product_id: product._id,
          variant_id: variant?._id || null,
          quantity,
          price: basePrice,
          discounted_price: discountedPrice,
          product_name: product.name || 'Unknown Product',
          product_image: variant?.images?.[0] || product.image_url?.[0] || null,
          variant_attributes: variant || {},
          tax_percentage: taxPercentage,
          stock
        };

        if (!cartItem.product_id) throw new Error('Product ID is required');
        if (!cartItem.product_name) throw new Error('Product name is required');
        if (cartItem.price <= 0) cartItem.price = 1;
        if (cartItem.discounted_price <= 0) cartItem.discounted_price = cartItem.price;

        const response = await cartAPI.addToCart(cartItem);

        if (response.success && response.data?.items) {
          const backendCartItems = transformCartItems(response.data.items);
          dispatch({ type: CART_ACTIONS.SET_CART, payload: backendCartItems });
        }
      } else {
        const updatedGuestCart = addToGuestCart(product, variant, quantity);
        dispatch({ type: CART_ACTIONS.SET_CART, payload: updatedGuestCart });
        toast.success('Item added to cart! Sign in to save across devices.', {
          duration: 3000,
          icon: '🛒'
        });
      }
    } catch (error) {
      console.error('CartContext: Error adding to cart:', error);
      toast.error('Failed to add item to cart');
      throw error;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      if (user && user.uid) {
        const response = await cartAPI.removeFromCart(itemId);
        if (response.success) {
          if (response.data?.items) {
            const transformedItems = transformCartItems(response.data.items);
            dispatch({ type: CART_ACTIONS.SET_CART, payload: transformedItems });
          } else {
            await handleUserLogin();
          }
        }
      } else {
        const currentItem = state.items.find(item => item.cartItemId === itemId || item.id === itemId);
        if (currentItem) {
          const updatedGuestCart = removeFromGuestCart(currentItem.id, currentItem.variant);
          dispatch({ type: CART_ACTIONS.SET_CART, payload: updatedGuestCart });
        }
      }
    } catch (error) {
      console.error('CartContext: Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
      throw error;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      if (user && user.uid) {
        const response = await cartAPI.updateCartItem(itemId, quantity);
        if (response.success) {
          if (response.data?.items) {
            const transformedItems = transformCartItems(response.data.items);
            dispatch({ type: CART_ACTIONS.SET_CART, payload: transformedItems });
          } else {
            await handleUserLogin();
          }
        }
      } else {
        const currentItem = state.items.find(item => item.cartItemId === itemId || item.id === itemId);
        if (currentItem) {
          const updatedGuestCart = updateGuestCartQuantity(currentItem.id, currentItem.variant, quantity);
          dispatch({ type: CART_ACTIONS.SET_CART, payload: updatedGuestCart });
        }
      }
    } catch (error) {
      console.error('CartContext: Error updating cart item quantity:', error);
      toast.error('Failed to update cart item');
      throw error;
    }
  };

  const clearCart = async (forceLocalClear = false) => {
    try {
      if (user && user.uid && !forceLocalClear) {
        const response = await cartAPI.clearCart();
        if (response.success) {
          dispatch({ type: CART_ACTIONS.CLEAR_CART });
        }
      } else {
        clearGuestCart();
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
      }
    } catch (error) {
      console.error('CartContext: Error clearing cart:', error);
      if (forceLocalClear || error.response?.status === 404 || !error.response) {
        clearGuestCart();
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
      } else {
        toast.error('Failed to clear cart');
        throw error;
      }
    }
  };

  const getTotal = () =>
    state.items.reduce((total, item) => total + (item.price * item.quantity), 0);

  const getDiscountedTotal = () =>
    state.items.reduce((total, item) => {
      const price = item.discounted_price || item.price;
      return total + (price * item.quantity);
    }, 0);

  const isInCart = (productId, variantAttributes = {}) =>
    state.items.some(item =>
      item.id === productId &&
      JSON.stringify(item.variant || {}) === JSON.stringify(variantAttributes)
    );

  const getItemQuantity = (productId, variantAttributes = {}) => {
    const item = state.items.find(item =>
      item.id === productId &&
      JSON.stringify(item.variant || {}) === JSON.stringify(variantAttributes)
    );
    return item ? item.quantity : 0;
  };

  const value = {
    items: state.items,
    itemCount: state.itemCount,
    loading: state.loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getDiscountedTotal,
    isInCart,
    getItemQuantity,
    isUsingCookies: false,
    isAuthenticated: !!(user && user.uid),
    isGuestMode: !(user && user.uid)
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartProvider;