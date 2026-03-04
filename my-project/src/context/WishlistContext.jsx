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
      return {
        ...state,
        items: action.payload,
        itemCount: action.payload.length,
        loading: false
      };
    case WISHLIST_ACTIONS.ADD_ITEM:
      return {
        ...state,
        items: action.payload,
        itemCount: action.payload.length
      };
    case WISHLIST_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: action.payload,
        itemCount: action.payload.length
      };
    case WISHLIST_ACTIONS.CLEAR_WISHLIST:
      return {
        ...state,
        items: [],
        itemCount: 0
      };
    case WISHLIST_ACTIONS.SET_LOADING:
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

export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { user, loading: authLoading, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    window.__CURRENT_USER__ = user;
  }, [user]);

  useEffect(() => {
    if (!user || !user.uid) {
      const guestWishlist = getGuestWishlist();
      dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: guestWishlist });
      console.log('WishlistContext: Loaded guest wishlist with', guestWishlist.length, 'items');
    }
  }, []);

  useEffect(() => {
    console.log('WishlistContext: Auth state changed:', {
      user: user ? user.uid : 'null',
      authLoading,
      isAuthenticated
    });

    if (authLoading) {
      console.log('WishlistContext: Auth still loading, waiting...');
      return;
    }

    if (user && user.uid && isAuthenticated) {
      console.log('WishlistContext: User authenticated, migrating guest wishlist and loading from MongoDB for:', user.uid);
      handleUserLogin();
    } else {
      console.log('WishlistContext: User not authenticated, loading guest wishlist');
      const guestWishlist = getGuestWishlist();
      dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: guestWishlist });
    }
  }, [user, authLoading, isAuthenticated]);

  useEffect(() => {
    const handleAuthUserRestored = () => {
      console.log('WishlistContext: Auth user restored event received');
      if (user && user.uid && isAuthenticated) {
        console.log('WishlistContext: Triggering wishlist reload after auth restoration');
        handleUserLogin();
      }
    };

    window.addEventListener('auth:user-restored', handleAuthUserRestored);
    return () => {
      window.removeEventListener('auth:user-restored', handleAuthUserRestored);
    };
  }, [user, isAuthenticated]);

  const transformBackendItems = (items) =>
    items.map(item => ({
      _id: item.product_id?._id || item.product_id,
      id: item.product_id?._id || item.product_id,
      name: item.product_name,
      price: item.discounted_price,
      image: item.product_image,
      wishlistItemId: item._id,
      slug: item.product_id?.slug || null
    }));

  const handleUserLogin = async (retryCount = 0) => {
    if (!user || !user.uid) {
      console.log('No valid user found, skipping wishlist load');
      return;
    }

    console.log('User logged in, loading wishlist from MongoDB for user:', user.uid, 'retry:', retryCount);
    dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: true });

    try {
      const guestWishlist = getGuestWishlist();
      console.log('Guest wishlist items to migrate:', guestWishlist.length);

      const backendWishlistResponse = await wishlistAPI.getWishlist();

      if (backendWishlistResponse.success && backendWishlistResponse.data?.items?.length > 0) {
        console.log('Wishlist loaded from MongoDB:', backendWishlistResponse.data.items.length, 'items');
        const backendWishlistItems = transformBackendItems(backendWishlistResponse.data.items);
        dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: backendWishlistItems });

        if (guestWishlist.length > 0) {
          console.log('Migrating guest wishlist items to MongoDB...');
          await migrateGuestWishlistItems(guestWishlist);
        }
      } else {
        console.log('No wishlist found in MongoDB');
        if (guestWishlist.length > 0) {
          console.log('Migrating guest wishlist items to MongoDB...');
          await migrateGuestWishlistItems(guestWishlist);
        } else {
          dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
        }
      }
    } catch (error) {
      console.error('Error loading wishlist from MongoDB:', error);

      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.warn('Authentication error loading wishlist');
        if (retryCount === 0) {
          console.log('Retrying wishlist load after auth error...');
          setTimeout(() => handleUserLogin(1), 1000);
          return;
        } else {
          toast.error('Please login again to access your wishlist');
        }
      } else {
        if (retryCount === 0) {
          console.log('Retrying wishlist load after error...');
          setTimeout(() => handleUserLogin(1), 500);
          return;
        } else {
          toast.error('Failed to load wishlist data');
        }
      }

      dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
    } finally {
      dispatch({ type: WISHLIST_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const migrateGuestWishlistItems = async (guestWishlistItems) => {
    try {
      console.log('Starting guest wishlist migration:', guestWishlistItems.length, 'items');
      let migratedCount = 0;

      for (const guestItem of guestWishlistItems) {
        try {
          const wishlistItem = {
            product_id: guestItem._id || guestItem.id,
            product_name: guestItem.name,
            product_image: guestItem.image,
            price: guestItem.price,
            discounted_price: guestItem.price
          };

          const response = await wishlistAPI.addToWishlist(wishlistItem);
          if (response.success) {
            migratedCount++;
            console.log('Successfully migrated guest wishlist item:', guestItem.name);
          }
        } catch (error) {
          // 400 means already exists — that's fine during migration
          if (error.response?.status === 400) {
            console.log('Item already in wishlist during migration (skipping):', guestItem.name);
            migratedCount++;
          } else {
            console.error('Failed to migrate guest wishlist item:', guestItem.name, error);
          }
        }
      }

      console.log('Guest wishlist migration completed:', migratedCount, 'of', guestWishlistItems.length, 'items migrated');

      if (migratedCount > 0) {
        try {
          const backendWishlistResponse = await wishlistAPI.getWishlist();
          if (backendWishlistResponse.success && backendWishlistResponse.data?.items) {
            const backendWishlistItems = transformBackendItems(backendWishlistResponse.data.items);
            dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: backendWishlistItems });
            clearGuestWishlist();
          }
        } catch (error) {
          console.error('Error reloading wishlist after migration:', error);
        }
        toast.success(`${migratedCount} items moved to your wishlist`);
      } else {
        clearGuestWishlist();
      }
    } catch (error) {
      console.error('Error during guest wishlist migration:', error);
    }
  };

  const addToWishlist = async (product) => {
    try {
      const validProductId = product._originalProductId || product.parentProductId || product._id;
      console.log('WishlistContext: Adding to wishlist:', validProductId);

      if (user && user.uid) {
        // Check local state first to avoid duplicate API calls
        const alreadyInWishlist = state.items.some(item => item._id === validProductId);
        if (alreadyInWishlist) {
          console.log('WishlistContext: Item already in local wishlist state, skipping add');
          toast.info('Item is already in your wishlist', { duration: 3000, icon: 'ℹ️' });
          return;
        }

        const basePrice = product.selling_price || product.price || product.mrp || 1;
        const discountedPrice = product.salePrice || product.selling_price || product.price || product.mrp || basePrice;

        const wishlistItem = {
          product_id: validProductId,
          product_name: product.name || 'Unknown Product',
          product_image: product.images?.[0]?.url || product.image_url?.[0] || null,
          price: basePrice <= 0 ? 1 : basePrice,
          discounted_price: discountedPrice <= 0 ? (basePrice <= 0 ? 1 : basePrice) : discountedPrice
        };

        console.log('WishlistContext: Sending wishlist item:', wishlistItem);
        console.log('WishlistContext: Original product data:', {
          _id: product._id,
          name: product.name,
          price: product.price,
          selling_price: product.selling_price,
          salePrice: product.salePrice,
          mrp: product.mrp
        });

        if (!wishlistItem.product_id) throw new Error('Product ID is required');
        if (!wishlistItem.product_name) throw new Error('Product name is required');

        const response = await wishlistAPI.addToWishlist(wishlistItem);

        if (response.success) {
          console.log('WishlistContext: Item added to MongoDB wishlist successfully');

          if (response.data?.items) {
            // Backend returned full updated wishlist
            const backendWishlistItems = transformBackendItems(response.data.items);
            dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: backendWishlistItems });
          } else {
            // Backend returned single item or just success — optimistically update local state
            const newItem = {
              _id: validProductId,
              id: validProductId,
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
        console.log('WishlistContext: Adding to guest wishlist for non-authenticated user');
        const updatedGuestWishlist = addToGuestWishlist(product);
        dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: updatedGuestWishlist });
        console.log('WishlistContext: Item added to guest wishlist successfully');

        toast.success('Item added to wishlist! Sign in to save across devices.', {
          duration: 3000,
          icon: '❤️'
        });
      }
    } catch (error) {
      console.error('WishlistContext: Error adding to wishlist:', error);

      // 400 = already exists in backend — sync local state from backend
      if (error.response?.status === 400 &&
        error.response?.data?.message === 'Item already exists in wishlist') {
        console.log('WishlistContext: Item already in backend wishlist, resyncing local state...');

        // Resync from backend so local state matches
        try {
          const backendWishlistResponse = await wishlistAPI.getWishlist();
          if (backendWishlistResponse.success && backendWishlistResponse.data?.items) {
            const backendWishlistItems = transformBackendItems(backendWishlistResponse.data.items);
            dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: backendWishlistItems });
          }
        } catch (syncError) {
          console.error('WishlistContext: Failed to resync wishlist:', syncError);
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
      console.log('WishlistContext: Removing product from wishlist:', productId);

      if (user && user.uid) {
        const response = await wishlistAPI.removeFromWishlistByProduct(productId);

        if (response.success) {
          console.log('WishlistContext: Item successfully removed from backend wishlist');

          if (response.data?.items) {
            const backendWishlistItems = transformBackendItems(response.data.items);
            dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: backendWishlistItems });
          } else {
            // Optimistically remove from local state
            dispatch({
              type: WISHLIST_ACTIONS.SET_WISHLIST,
              payload: state.items.filter(item => item._id !== productId)
            });
          }
        }
      } else {
        console.log('WishlistContext: Removing from guest wishlist for non-authenticated user');
        const updatedGuestWishlist = removeFromGuestWishlist(productId);
        dispatch({ type: WISHLIST_ACTIONS.SET_WISHLIST, payload: updatedGuestWishlist });
        console.log('WishlistContext: Item removed from guest wishlist successfully');
      }
    } catch (error) {
      console.error('WishlistContext: Error removing from wishlist:', error);
      toast.error('Failed to remove item from wishlist. Please try again.');
      throw error;
    }
  };

  const toggleWishlistItem = async (product) => {
    try {
      const validProductId = product._originalProductId || product.parentProductId || product._id;
      console.log('WishlistContext: Toggling wishlist item:', validProductId);

      const wasInWishlist = state.items.some(item => item._id === validProductId);

      if (wasInWishlist) {
        await removeFromWishlist(validProductId);
      } else {
        await addToWishlist(product);
      }

      console.log('WishlistContext: Wishlist item toggled successfully');
    } catch (error) {
      console.error('WishlistContext: Error toggling wishlist item:', error);
      throw error;
    }
  };

  const clearWishlist = async () => {
    try {
      console.log('WishlistContext: Clearing wishlist');

      if (user && user.uid) {
        const response = await wishlistAPI.clearWishlist();
        if (response.success) {
          dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
          console.log('WishlistContext: MongoDB wishlist cleared successfully');
        }
      } else {
        clearGuestWishlist();
        dispatch({ type: WISHLIST_ACTIONS.CLEAR_WISHLIST });
        console.log('WishlistContext: Guest wishlist cleared successfully');
      }
    } catch (error) {
      console.error('WishlistContext: Error clearing wishlist:', error);
      toast.error('Failed to clear wishlist');
      throw error;
    }
  };

  const isInWishlist = (productId) => {
    return state.items.some(item => item._id === productId);
  };

  const getWishlistItem = (productId) => {
    return state.items.find(item => item._id === productId);
  };

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
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistProvider;