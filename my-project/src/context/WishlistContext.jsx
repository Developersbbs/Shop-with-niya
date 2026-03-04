import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { wishlistAPI } from '../services/wishlistService';
import toast from 'react-hot-toast';
import {
  getGuestWishlist,
  addToGuestWishlist,
  removeFromGuestWishlist,
  clearGuestWishlist,
  isInGuestWishlist,
  getGuestWishlistCount
} from '../utils/guestStorage';

const WishlistContext = createContext();

const WISHLIST_ACTIONS = {
  SET_WISHLIST: 'SET_WISHLIST',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_WISHLIST: 'CLEAR_WISHLIST',
  SET_LOADING: 'SET_LOADING'
};

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case WISHLIST_ACTIONS.SET_WISHLIST:
      return { ...state, items: action.payload, itemCount: action.payload.length, loading: false };
    case WISHLIST_ACTIONS.ADD_ITEM:
      return { ...state, items: action.payload, itemCount: action.payload.length };
    case WISHLIST_ACTIONS.REMOVE_ITEM:
      return { ...state, items: action.payload, itemCount: action.payload.length };
    case WISHLIST_ACTIONS.CLEAR_WISHLIST:
      return { ...state, items: [], itemCount: 0 };
    case WISHLIST_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const initialState = { items: [], itemCount: 0, loading: true };

export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { user, loading: authLoading, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => { window.__CURRENT_USER__ = user; }, [user]);

  useEffect(() => {
    if (!user || !user.uid) {
      const guestWishlist = getGuestWishlist();
      dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: guestWishlist });
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (user && user.uid && isAuthenticated) {
      handleUserLogin();
    } else {
      const guestWishlist = getGuestWishlist();
      dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: guestWishlist });
    }
  }, [user, authLoading, isAuthenticated]);

  useEffect(() => {
    const handleAuthUserRestored = () => {
      if (user && user.uid && isAuthenticated) handleUserLogin();
    };
    window.addEventListener('auth:user-restored', handleAuthUserRestored);
    return () => window.removeEventListener('auth:user-restored', handleAuthUserRestored);
  }, [user, isAuthenticated]);

  // ✅ FIX: Read image from both product_image field AND populated product_id.image_url
const transformBackendItems = (items) =>
  items.map(item => {
    const populatedProduct = item.product_id && typeof item.product_id === 'object' ? item.product_id : null;
    const image = item.product_image || populatedProduct?.image_url?.[0] || null;
    const price = item.discounted_price || item.price || populatedProduct?.selling_price || 0;

    return {
      _id: populatedProduct?._id || item.product_id,
      id: populatedProduct?._id || item.product_id,
      variant_id: item.variant_id || null,  // ✅ include variant_id
      name: item.product_name || populatedProduct?.name || 'Unknown Product',
      price,
      image,
      wishlistItemId: item._id,
      slug: populatedProduct?.slug || null,
      variant_name: item.variant_name || null,
      variant_attributes: item.variant_attributes || {}
    };
  });

  const handleUserLogin = async (retryCount = 0) => {
    if (!user || !user.uid) return;
    dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });
    try {
      const guestWishlist = getGuestWishlist();
      const backendWishlistResponse = await wishlistAPI.getWishlist();

      if (backendWishlistResponse.success && backendWishlistResponse.data?.items?.length > 0) {
        const backendWishlistItems = transformBackendItems(backendWishlistResponse.data.items);
        dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: backendWishlistItems });
        if (guestWishlist.length > 0) await migrateGuestWishlistItems(guestWishlist);
      } else {
        if (guestWishlist.length > 0) {
          await migrateGuestWishlistItems(guestWishlist);
        } else {
          dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
      if (retryCount === 0) {
        setTimeout(() => handleUserLogin(1), error.response?.status === 401 ? 1000 : 500);
        return;
      }
      dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
    } finally {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // ✅ FIX: migrateGuestWishlistItems properly using guestItem fields
  const migrateGuestWishlistItems = async (guestWishlistItems) => {
    try {
      let migratedCount = 0;
      for (const guestItem of guestWishlistItems) {
        try {
          const wishlistItem = {
            product_id: guestItem._id || guestItem.id,
            product_name: guestItem.name,
            product_image: guestItem.image,
            price: guestItem.price || 1,
            discounted_price: guestItem.price || 1
          };
          const response = await wishlistAPI.addToWishlist(wishlistItem);
          if (response.success) migratedCount++;
        } catch (error) {
          if (error.response?.status === 400) {
            migratedCount++;
          } else {
            console.error('Failed to migrate guest wishlist item:', guestItem.name, error);
          }
        }
      }

      if (migratedCount > 0) {
        const backendWishlistResponse = await wishlistAPI.getWishlist();
        if (backendWishlistResponse.success && backendWishlistResponse.data?.items) {
          const backendWishlistItems = transformBackendItems(backendWishlistResponse.data.items);
          dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: backendWishlistItems });
          clearGuestWishlist();
        }
        toast.success(`${migratedCount} items moved to your wishlist`);
      } else {
        clearGuestWishlist();
      }
    } catch (error) {
      console.error('Error during guest wishlist migration:', error);
    }
  };

const addToWishlist = async (product, variant = null) => {
  try {
    const validProductId = product._originalProductId || product.parentProductId || product._id;

    if (user && user.uid) {
      const alreadyInWishlist = state.items.some(item =>
        item._id === validProductId &&
        (variant ? item.variant_id === variant._id?.toString() : !item.variant_id)
      );
      if (alreadyInWishlist) {
        toast.info('Item is already in your wishlist', { duration: 3000, icon: 'ℹ️' });
        return;
      }

      const wishlistItem = {
        product_id: validProductId,
        variant_id: variant?._id || null,  // ✅ pass variant_id
        product_name: product.name || 'Unknown Product',
        product_image: variant?.images?.[0] || product.image_url?.[0] || product.images?.[0]?.url || null,
        price: variant?.selling_price || product.selling_price || product.price || product.mrp || 1,
        discounted_price: variant?.selling_price || product.selling_price || product.price || product.mrp || 1
      };

      if (!wishlistItem.product_id) throw new Error('Product ID is required');

      const response = await wishlistAPI.addToWishlist(wishlistItem);

      if (response.success) {
        if (response.data?.items) {
          dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: transformBackendItems(response.data.items) });
        } else {
          const newItem = {
            _id: validProductId,
            id: validProductId,
            variant_id: variant?._id || null,
            name: wishlistItem.product_name,
            price: wishlistItem.discounted_price,
            image: wishlistItem.product_image,
            wishlistItemId: response.data?._id || null,
            slug: product.slug || null
          };
          dispatch({
            type: WISHLIST_ACTIONS.SET_WISHLIST,
            payload: [...state.items.filter(i => i._id !== validProductId), newItem]
          });
        }
      }
    } else {
      const updatedGuestWishlist = addToGuestWishlist(product);
      dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: updatedGuestWishlist });
      toast.success('Item added to wishlist! Sign in to save across devices.', { duration: 3000, icon: '❤️' });
    }
  } catch (error) {
    console.error('WishlistContext: Error adding to wishlist:', error);
    if (error.response?.status === 400 && error.response?.data?.message === 'Item already exists in wishlist') {
      try {
        const backendWishlistResponse = await wishlistAPI.getWishlist();
        if (backendWishlistResponse.success && backendWishlistResponse.data?.items) {
          dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: transformBackendItems(backendWishlistResponse.data.items) });
        }
      } catch (syncError) {
        console.error('Failed to resync wishlist:', syncError);
      }
      toast.info('Item is already in your wishlist', { duration: 3000, icon: 'ℹ️' });
      return;
    }
    toast.error('Failed to add item to wishlist');
    throw error;
  }
};

  const removeFromWishlist = async (productId) => {
    try {
      if (user && user.uid) {
        const response = await wishlistAPI.removeFromWishlistByProduct(productId);
        if (response.success) {
          if (response.data?.items) {
            dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: transformBackendItems(response.data.items) });
          } else {
            dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: state.items.filter(item => item._id !== productId) });
          }
        }
      } else {
        const updatedGuestWishlist = removeFromGuestWishlist(productId);
        dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: updatedGuestWishlist });
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item from wishlist.');
      throw error;
    }
  };

  const toggleWishlistItem = async (product) => {
    try {
      const validProductId = product._originalProductId || product.parentProductId || product._id;
      const wasInWishlist = state.items.some(item => item._id === validProductId);
      if (wasInWishlist) {
        await removeFromWishlist(validProductId);
      } else {
        await addToWishlist(product);
      }
    } catch (error) {
      console.error('Error toggling wishlist item:', error);
      throw error;
    }
  };

  const clearWishlist = async () => {
    try {
      if (user && user.uid) {
        const response = await wishlistAPI.clearWishlist();
        if (response.success) dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
      } else {
        clearGuestWishlist();
        dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
      }
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
      throw error;
    }
  };

  const isInWishlist = (productId) => state.items.some(item => item._id === productId);
  const getWishlistItem = (productId) => state.items.find(item => item._id === productId);

  const value = {
    items: state.items,
    itemCount: state.itemCount,
    loading: state.loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlistItem,
    clearWishlist,
    isInWishlist,
    getWishlistItem,
    isUsingCookies: false,
    isAuthenticated: !!(user && user.uid),
    isGuestMode: !(user && user.uid)
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};

export default WishlistProvider;