import React from 'react';
import { useGetProductsQuery } from '../redux/services/products';
import Hero from '../components/home/Hero';
import Categories from '../components/home/Categories';
import OffersSection from '../components/home/OffersSection';
import Testimonials from '../components/home/Testimonials';
import Newsletter from '../components/home/Newsletter';
import WhyUs from '../pages/WhuUs';


const HomePage = () => {
  const { isLoading } = useGetProductsQuery({ limit: 8 }); // ← remove error

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  // ← remove the error block entirely, just render the page
  return (
    <div>
      <Hero />
      <div className="space-y-0">
        <Categories />
        <OffersSection />
        <WhyUs />
        <Testimonials />
        <Newsletter />
      </div>
    </div>
  );
};

export default HomePage;