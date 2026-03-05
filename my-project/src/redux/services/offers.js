import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../config/api';

export const offersApi = createApi({
    reducerPath: 'offersApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE_URL,
        prepareHeaders: (headers) => {
            const token = localStorage.getItem('token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Offer', 'ComboOffer'],
    endpoints: (builder) => ({
        getOffers: builder.query({
            query: (params) => {
                const queryParams = new URLSearchParams(params);
                return `offers?${queryParams.toString()}`;
            },
            providesTags: ['Offer'],
        }),
        getComboOffers: builder.query({
            query: () => 'combo-offers',
            providesTags: ['ComboOffer'],
        }),
        getComboOffersForPage: builder.query({
            query: () => 'combo-offers/offers-page',
            providesTags: ['ComboOffer'],
        }),
        getOfferById: builder.query({
            query: (id) => `offers/${id}`,
            providesTags: (result, error, id) => [{ type: 'Offer', id }],
        }),
        getComboOfferById: builder.query({
            query: (id) => `combo-offers/${id}`,
            providesTags: (result, error, id) => [{ type: 'ComboOffer', id }],
        }),
    }),
});

export const {
    useGetOffersQuery,
    useGetComboOffersQuery,
    useGetComboOffersForPageQuery,
    useGetOfferByIdQuery,
    useGetComboOfferByIdQuery,
} = offersApi;
