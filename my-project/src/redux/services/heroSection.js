import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const heroSectionApi = createApi({
  reducerPath: 'heroSectionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/hero-section`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getHeroSlides: builder.query({
      query: (params = {}) => ({
        url: '/',
        params: { ...params },
      }),
      transformResponse: (response) => ({
        ...response,
        data: response.data || [],
      }),
    }),
  }),
});

export const { useGetHeroSlidesQuery } = heroSectionApi;