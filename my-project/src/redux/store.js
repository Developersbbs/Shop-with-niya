import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { productsApi } from './services/products';
import { categoriesApi } from './services/categories';
import { offersApi } from './services/offers';
import authReducer from './slices/authSlice';
import { heroSectionApi } from './services/heroSection';

export const store = configureStore({
  reducer: {
    [productsApi.reducerPath]: productsApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [offersApi.reducerPath]: offersApi.reducer,
    [heroSectionApi.reducerPath]: heroSectionApi.reducer,
    auth: authReducer,
  },
middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware().concat([
    productsApi.middleware,
    categoriesApi.middleware,
    offersApi.middleware,
    heroSectionApi.middleware, // ← add this
  ]),

});

setupListeners(store.dispatch);

export default store;
