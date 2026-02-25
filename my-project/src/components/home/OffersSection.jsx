import React from 'react';
import { useGetOffersQuery } from '../../redux/services/offers';
import { Link } from 'react-router-dom';
import LazyImage from '../common/LazyImage';

const OfferBanner = ({ offer }) => {
    const {
        title,
        description,
        image_url,
        offer_type,
        slug,
        flash_config,
        category_config,
        bogo_config
    } = offer;

    // Determine link target
    let linkTarget = `/offers/${slug}`; // Default to offer details page if exists
    // Or we could link to categories if it's a category discount

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gray-900 shadow-xl group h-64 md:h-80 w-full flex-shrink-0">
            {/* Background Image */}
            <div className="absolute inset-0">
                <LazyImage
                    src={image_url || 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-center max-w-lg">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white mb-4 uppercase tracking-wider border border-white/30">
                        {offer_type?.replace('_', ' ') || 'Special Offer'}
                    </span>
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                        {title}
                    </h3>
                    <p className="text-gray-200 mb-6 line-clamp-2 md:text-lg">
                        {description}
                    </p>
                    <button className="px-8 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg transform hover:scale-105 active:scale-95">
                        Shop Now
                    </button>
                </div>
            </div>
        </div>
    );
};

const OffersSection = () => {
    // Fetch active offers with high priority
    const { data: response, isLoading } = useGetOffersQuery({
        limit: 3,
        status: 'active',
        sort: 'priority',
        order: 'desc'
    });

    const offers = response?.data || [];

    if (isLoading || offers.length === 0) return null;

    return (
        <section className="py-12 bg-white">
            <div className="container mx-auto px-4">
                <div className={`grid grid-cols-1 ${offers.length === 1 ? 'md:grid-cols-1' : offers.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6`}>
                    {offers.map((offer) => (
                        <Link key={offer._id} to={`/offers`} className="block">
                            <OfferBanner offer={offer} />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default OffersSection;
