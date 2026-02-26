import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetProductByIdQuery, useGetProductBySlugQuery } from '../redux/services/products';
import ProductDetails from '../components/product/ProductDetails';

const ProductDetailPage = () => {
  const [cartUpdated, setCartUpdated] = useState(false);
  const { slug } = useParams();
  const navigate = useNavigate();
  
  // Validate the slug
  const isValidSlug = useMemo(() => {
    if (!slug || typeof slug !== 'string' || slug.trim() === '') {
      return false;
    }
    return true;
  }, [slug]);
  
  // Check if it's a MongoDB ID (fallback support)
  const isMongoId = useMemo(() => {
    if (!isValidSlug) return false;
    return /^[0-9a-fA-F]{24}$/.test(slug);
  }, [slug, isValidSlug]);
  
  // Fetch by slug first (skip if it looks like a MongoDB ID)
  const { 
    data: productBySlug, 
    isError: slugError,
    isSuccess: slugSuccess,
    isLoading: isLoadingSlug
  } = useGetProductBySlugQuery(slug, { 
    skip: !isValidSlug || isMongoId
  });
  
  // Fetch by ID if it's a MongoDB ID or slug fetch failed
  const { 
    data: productById, 
    isError: idError,
    isSuccess: idSuccess,
    isLoading: isLoadingId
  } = useGetProductByIdQuery(slug, { 
    skip: !isValidSlug || (!isMongoId && !slugError)
  });

  useEffect(() => {
    if (!isValidSlug || (slugError && (idError || !isMongoId))) {
      navigate('/404');
    }
  }, [slugError, idError, slug, navigate, isValidSlug, isMongoId]);

  const product = productBySlug?.data || productById?.data;
  const isLoading = (isLoadingSlug && !isMongoId) || (isLoadingId && (isMongoId || slugError));
  const isError = (!isMongoId && slugError && (idError || !isMongoId)) || (isMongoId && idError);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800">Product Not Found</h1>
          <p className="text-gray-600 mt-2">The product you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => navigate('/products')}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <ProductDetails 
        product={product} 
        isLoading={isLoading} 
        isError={isError}
        onCartUpdate={() => setCartUpdated(prev => !prev)}
      />
    </div>
  );
};

export default ProductDetailPage;