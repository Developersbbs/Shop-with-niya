// import React from 'react';
// import { Link } from 'react-router-dom';
// import { useGetProductsQuery } from '../redux/services/products';
// import ProductCard from '../components/product/ProductCard';
// import Hero from '../components/home/Hero';
// import Categories from '../components/home/Categories';
// import FeaturedProducts from '../components/home/FeaturedProducts';
// import OffersSection from '../components/home/OffersSection';
// import ComboOffersSection from '../components/home/ComboOffersSection';
// import Testimonials from '../components/home/Testimonials';
// import Newsletter from '../components/home/Newsletter';
// import WhyUs from './WhuUs';

// const HomePage = () => {
//   // Show a limited number of featured products on the home page
//   const { data: products, isLoading, error } = useGetProductsQuery({ limit: 8 });

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return <div className="text-center text-red-500 py-8">Error loading products. Please try again later.</div>;
//   }

//   return (
//     <div className="space-y-12">
//       {/* Hero Section */}
//       <Hero />

//       {/* Offers Banners */}
//       {/* <OffersSection /> */}

//       {/* Featured Categories */}
//       <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
//         {/* Background Decorations */}
//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
//           <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
//         </div>

//         <div className="container mx-auto px-4 relative">
//           <div className="text-center mb-16">

//             <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
//               Shop by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Category</span>
//             </h2>
//             <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
//             Explore our thoughtfully selected women’s fashion collections created for every style and occasion. From everyday wear to statement pieces, discover outfits that fit your life beautifully.
//             </p>
//           </div>
//           <Categories />
//         </div>
//       </section>

//       {/* Featured Products Section */}
//       {/* <section className="py-20 bg-white">
//         <div className="container mx-auto px-4">
//           <div className="flex flex-col md:flex-row justify-between items-center mb-16">
//             <div>
//               <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
//                 Featured <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Products</span>
//               </h2>
//               <p className="text-xl text-gray-600">Handpicked items just for you</p>
//             </div>
//             <Link
//               to="/products"
//               className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
//             >
//               View All Products
//               <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
//               </svg>
//             </Link>
//           </div>

//           {isLoading ? (
//             <div className="flex justify-center items-center h-64">
//               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
//             </div>
//           ) : error ? (
//             <div className="text-center text-red-500 py-8">Error loading products. Please try again later.</div>
//           ) : products?.products?.length > 0 ? (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//               {products.products.map((product) => (
//                 <ProductCard key={product._id} product={product} />
//               ))}
//             </div>
//           ) : (
//             <div className="text-center py-12">
//               <p className="text-gray-500">No featured products available at the moment.</p>
//             </div>
//           )}

//           <div className="mt-8 flex justify-center">
//             <Link
//               to="/products"
//               className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               View All Products
//             </Link>
//           </div>
//         </div>
//       </section> */}

//       {/* Why Us */}


//       {/* Combo Offers */}
//       <OffersSection />

// <WhyUs />


//       {/* Testimonials */}
//       <Testimonials />

//       {/* Newsletter */}
//       <Newsletter />
//     </div>
//   );
// };

// export default HomePage;



// 

import React from 'react';
import { useGetProductsQuery } from '../redux/services/products';
import Hero from '../components/home/Hero';
import Categories from '../components/home/Categories';
import OffersSection from '../components/home/OffersSection';

import ComboOffersSection from '../components/home/ComboOffersSection';
import Testimonials from '../components/home/Testimonials';
import Newsletter from '../components/home/Newsletter';
import WhyUs from './WhuUs';

const HomePage = () => {
  const { isLoading, error } = useGetProductsQuery({ limit: 8 });

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="text-center text-red-500 py-8">Error loading. Please try again.</div>
  );

  return (
    <div>
      <Hero />
      <div className="space-y-0">
         <Categories />
        <OffersSection />
       
        <WhyUs />
        {/* <ComboOffersSection /> */}
        <Testimonials />
        <Newsletter />
      </div>
    </div>
  );
};

export default HomePage;