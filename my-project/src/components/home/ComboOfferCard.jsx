import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import LazyImage from '../common/LazyImage';
import toast from 'react-hot-toast';

const ComboOfferCard = ({ offer }) => {
    const { addToCart } = useCart();
    const [isAdding, setIsAdding] = useState(false);

    const {
        title,
        description,
        price,
        originalPrice,
        comboImage,
        products,
        savingsPercent,
        badgeType,
        endDate
    } = offer;

    const handleAddCombo = async () => {
        if (isAdding) return;
        setIsAdding(true);
        const toastId = toast.loading('Adding combo to cart...');

        try {
            let successCount = 0;
            for (const item of products) {
                if (item.productId) {
                    await addToCart(item.productId, null, item.quantity);
                    successCount++;
                }
            }

            if (successCount > 0) {
                toast.success('Combo offer added to cart!', { id: toastId });
            } else {
                toast.error('Failed to add combo items', { id: toastId });
            }
        } catch (error) {
            console.error('Error adding combo:', error);
            toast.error('Partially failed to add combo', { id: toastId });
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
            {/* Badge */}
            <div className="absolute top-4 left-4 z-10">
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${badgeType === 'HOT_SALE' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                        badgeType === 'BEST_VALUE' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                            'bg-gradient-to-r from-purple-500 to-pink-500'
                    }`}>
                    {badgeType?.replace('_', ' ') || 'LIMITED DEAL'}
                </span>
            </div>

            {/* Savings Badge */}
            {savingsPercent > 0 && (
                <div className="absolute top-4 right-4 z-10">
                    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-lg animate-pulse">
                        SAVE {savingsPercent}%
                    </div>
                </div>
            )}

            {/* Image */}
            <div className="h-48 overflow-hidden bg-gray-100 relative">
                <LazyImage
                    src={comboImage || (products[0]?.productId?.image_url?.[0])}
                    alt={title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {title}
                </h3>
                <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-grow">
                    {description}
                </p>

                {/* Combo Items Preview */}
                <div className="flex space-x-2 mb-4 overflow-hidden py-1">
                    {products.slice(0, 3).map((item, idx) => (
                        item.productId?.image_url?.[0] && (
                            <div key={idx} className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden relative" style={{ marginLeft: idx > 0 ? '-10px' : '0' }}>
                                <img
                                    src={item.productId.image_url[0].url || item.productId.image_url[0]}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )
                    ))}
                    {products.length > 3 && (
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500" style={{ marginLeft: '-10px' }}>
                            +{products.length - 3}
                        </div>
                    )}
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="text-gray-400 text-sm line-through">₹{originalPrice}</span>
                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                            ₹{price}
                        </span>
                    </div>
                    <button
                        onClick={handleAddCombo}
                        disabled={isAdding}
                        className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                    >
                        {isAdding ? 'Adding...' : 'Grab Deal'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComboOfferCard;
