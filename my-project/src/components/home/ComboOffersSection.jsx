import React from 'react';
import { useGetComboOffersQuery } from '../../redux/services/offers';
import ComboOfferCard from './ComboOfferCard';
import { Link } from 'react-router-dom';

const ComboOffersSection = () => {
    const { data: response, isLoading, error } = useGetComboOffersQuery();
    const comboOffers = response?.data || [];

    if (isLoading || comboOffers.length === 0) return null;
    if (error) return null;

    return (
        <section className="py-20 bg-gradient-to-b from-purple-50 to-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-20 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                    <div className="max-w-2xl">
                        <span className="text-purple-600 font-bold tracking-wider uppercase text-sm mb-2 block">Limited Time Deals</span>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Bundle & <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Save More</span>
                        </h2>
                        <p className="text-xl text-gray-600">
                            Curated combinations at unbeatable prices. Grab them while they last!
                        </p>
                    </div>
                    <Link
                        to="/offers"
                        className="hidden md:inline-flex items-center text-purple-600 font-semibold hover:text-purple-700 transition-colors"
                    >
                        View All Offers
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {comboOffers.map((offer) => (
                        <ComboOfferCard key={offer._id} offer={offer} />
                    ))}
                </div>

                <div className="mt-8 text-center md:hidden">
                    <Link
                        to="/offers"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                        View All Offers
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default ComboOffersSection;
