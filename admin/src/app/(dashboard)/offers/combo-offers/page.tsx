'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaPercent, FaCalendarAlt, FaChevronUp, FaChevronDown, FaUpload, FaGift } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Typography from '@/components/ui/typography';
import { addComboOffer, updateComboOffer, deleteComboOffer } from '@/actions/combo-offers/index';
import { uploadFile } from '@/lib/firebase/storage';
import { toast } from 'sonner';

interface ComboOffer {
    _id: string;
    title: string;
    description: string;
    price: number;
    originalPrice: number;
    isLimitedTime: boolean;
    isActive: boolean;
    badgeType: 'LIMITED_TIME' | 'BEST_VALUE' | 'HOT_SALE';
    showOnHomepage: boolean;
    showOnOffersPage: boolean;
    startDate?: string;
    endDate?: string;
    displayPriority: number;
    comboImage?: string;
    products: Array<{
        productId: string;
        quantity: number;
    }>;
    savingsPercent?: number;
}

interface Product {
    _id: string;
    name: string;
    sku?: string;
    image_url?: string[];
    selling_price?: number;
    product_variants?: {
        _id: string;
        selling_price?: number;
    }[];
}

export default function ComboOffersPage() {
    const [offers, setOffers] = useState<ComboOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Add submit loading state
    const [currentOffer, setCurrentOffer] = useState<ComboOffer | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        originalPrice: '',
        isLimitedTime: true,
        isActive: true,
        badgeType: 'LIMITED_TIME' as 'LIMITED_TIME' | 'BEST_VALUE' | 'HOT_SALE',
        showOnHomepage: true,
        showOnOffersPage: true,
        startDate: '',
        endDate: '',
        displayPriority: 0,
        comboImage: null as File | null,
        comboImageUrl: '', // Firebase URL for uploaded image
        products: [] as Array<{
            type: "existing" | "new";
            productId?: string;
            name: string;
            thumbnail: string;
            quantity: number;
            stock?: number;
            basePrice?: number;
            price?: number; // Add price for existing products
        }>
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

    const fetchOffers = useCallback(async () => {
        try {
            const res = await fetch(`${baseUrl}/combo-offers/admin`);
            const data = await res.json();
            if (data.success) {
                setOffers(data.data);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            price: '',
            originalPrice: '',
            isLimitedTime: true,
            isActive: true,
            badgeType: 'LIMITED_TIME',
            showOnHomepage: true,
            showOnOffersPage: true,
            startDate: '',
            endDate: '',
            displayPriority: 0,
            comboImage: null,
            comboImageUrl: '',
            products: []
        });
        setIsEditing(false);
        setCurrentOffer(null);
    };

    const handleEdit = async (offer: ComboOffer) => {
        setCurrentOffer(offer);

        // Fetch product details for each product in the combo
        const productsWithDetails = await Promise.all(
            offer.products.map(async (product) => {
                try {
                    const res = await fetch(`${baseUrl}/products/${product.productId}`);
                    const productData = await res.json();

                    if (productData.success) {
                        return {
                            type: "existing" as const,
                            productId: product.productId,
                            name: productData.data.name,
                            thumbnail: productData.data.image_url?.[0] || '/api/placeholder/60/60',
                            quantity: product.quantity,
                            price: productData.data.selling_price
                        };
                    }
                    return null;
                } catch (error) {
                    console.error('Error fetching product details:', error);
                    return null;
                }
            })
        );

        // Filter out null values and set form data
        const validProducts = productsWithDetails.filter(p => p !== null);

        setFormData({
            title: offer.title,
            description: offer.description || '',
            price: offer.price.toString(),
            originalPrice: offer.originalPrice.toString(),
            isLimitedTime: offer.isLimitedTime,
            isActive: offer.isActive,
            badgeType: offer.badgeType,
            showOnHomepage: offer.showOnHomepage,
            showOnOffersPage: offer.showOnOffersPage,
            startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
            endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
            displayPriority: offer.displayPriority || 0,
            comboImage: null,
            comboImageUrl: offer.comboImage || '',
            products: validProducts
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this combo offer?')) return;

        try {
            const result = await deleteComboOffer(id);

            if (result.success) {
                fetchOffers();
                alert(result.message || 'Combo offer deleted successfully!');
            } else {
                alert(result.message || 'Failed to delete offer');
            }
        } catch (error) {
            console.error('Error deleting offer:', error);
            alert('Error deleting offer');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent multiple submissions
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            let comboImageUrl = formData.comboImageUrl;
            let comboImageToastId: string | number | undefined;

            // Upload combo image to Firebase Storage if a new file is selected
            if (formData.comboImage instanceof File) {
                try {
                    comboImageToastId = toast.loading('Uploading combo image to Firebase...');
                    comboImageUrl = await uploadFile(formData.comboImage, 'combo-offers/images');

                    // Dismiss loading toast and show success
                    if (comboImageToastId) {
                        toast.dismiss(comboImageToastId);
                    }
                    toast.success('Combo image uploaded successfully!');
                    console.log('Combo image uploaded to Firebase:', comboImageUrl);
                } catch (error) {
                    console.error('Error uploading combo image:', error);
                    if (comboImageToastId) {
                        toast.dismiss(comboImageToastId);
                    }
                    toast.error('Failed to upload combo image');
                    setIsSubmitting(false);
                    return;
                }
            }

            // Create FormData for server action
            const serverFormData = new FormData();
            serverFormData.append('title', formData.title);
            serverFormData.append('description', formData.description);
            serverFormData.append('price', formData.price);
            serverFormData.append('originalPrice', formData.originalPrice);
            serverFormData.append('isLimitedTime', formData.isLimitedTime.toString());
            serverFormData.append('isActive', formData.isActive.toString());
            serverFormData.append('badgeType', formData.badgeType);
            serverFormData.append('showOnHomepage', formData.showOnHomepage.toString());
            serverFormData.append('showOnOffersPage', formData.showOnOffersPage.toString());
            serverFormData.append('startDate', formData.startDate);
            serverFormData.append('endDate', formData.endDate);
            serverFormData.append('displayPriority', formData.displayPriority.toString());

            // Send Firebase URL instead of file
            serverFormData.append('comboImage', comboImageUrl);

            // Add products as JSON string (thumbnails already uploaded to Firebase)
            serverFormData.append('products', JSON.stringify(formData.products));

            let result;
            if (isEditing && currentOffer) {
                result = await updateComboOffer(currentOffer._id, serverFormData);
            } else {
                result = await addComboOffer(serverFormData);
            }

            if (result.success) {
                fetchOffers();
                resetForm();
                toast.success(result.message || 'Combo offer saved successfully!');
            } else {
                toast.error(result.message || 'Operation failed');
            }
        } catch (error: unknown) {
            console.error('Error saving offer:', error);
            toast.error(`Error saving offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateSavings = () => {
        const price = parseFloat(formData.price);
        const originalPrice = parseFloat(formData.originalPrice);
        if (originalPrice > 0 && price < originalPrice) {
            return Math.round(((originalPrice - price) / originalPrice) * 100);
        }
        return 0;
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                comboImage: file,
                comboImageUrl: '' // Reset URL when new file is selected
            }));
        }
    };

    const updateProductQuantity = (index: number, quantity: number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.map((product, i) =>
                i === index ? { ...product, quantity } : product
            )
        }));
    };

    const removeProduct = (index: number) => {
        setFormData(prev => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index)
        }));
    };

    // State for product type selection dialog
    const [showProductTypeDialog, setShowProductTypeDialog] = useState(false);
    const [productType, setProductType] = useState<'existing' | 'new' | null>(null);

    // State for existing product search
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);

    // Calculate original price from products
    const calculateOriginalPrice = useCallback(() => {
        return formData.products.reduce((total, product) => {
            let productPrice = 0;

            if (product.type === 'existing' && product.price) {
                productPrice = product.price;
            } else if (product.type === 'new' && product.basePrice) {
                productPrice = product.basePrice;
            }

            return total + (productPrice * product.quantity);
        }, 0);
    }, [formData.products]);

    // Update original price when products change
    useEffect(() => {
        const calculatedPrice = calculateOriginalPrice();
        setFormData(prev => ({
            ...prev,
            originalPrice: calculatedPrice.toFixed(2)
        }));
    }, [formData.products, calculateOriginalPrice]);
    const [newProductForm, setNewProductForm] = useState({
        name: '',
        thumbnail: null as File | null,
        stock: '',
        quantity: '1',
        basePrice: ''
    });

    const adjustPriority = (delta: number) => {
        setFormData(prev => ({
            ...prev,
            displayPriority: Math.max(0, prev.displayPriority + delta)
        }));
    };

    // Product type selection handlers
    const openProductTypeDialog = () => {
        setShowProductTypeDialog(true);
        setProductType(null);
    };

    const selectProductType = (type: 'existing' | 'new') => {
        setProductType(type);
        setShowProductTypeDialog(false);
        if (type === 'existing') {
            setShowProductSearch(true);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    // Existing product search
    const searchProducts = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setLoadingSearch(true);
        try {
            // Search for physical and digital products, excluding combo products
            const [physicalResponse, digitalResponse] = await Promise.all([
                fetch(`${baseUrl}/products?search=${encodeURIComponent(query)}&published=true&limit=10&productType=physical`),
                fetch(`${baseUrl}/products?search=${encodeURIComponent(query)}&published=true&limit=10&productType=digital`)
            ]);

            const physicalData = physicalResponse.ok ? await physicalResponse.json() : { data: [] };
            const digitalData = digitalResponse.ok ? await digitalResponse.json() : { data: [] };

            const allResults = [
                ...(physicalData.data || []),
                ...(digitalData.data || [])
            ];

            console.log('Search results:', allResults); // Debug log
            setSearchResults(allResults);
        } catch (error) {
            console.error('Error searching products:', error);
            setSearchResults([]);
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        console.log('Searching for:', query);
        console.log('API URL:', `${baseUrl}/products?search=${encodeURIComponent(query)}&published=true&limit=10&productType=physical`);
        searchProducts(query);
    };

    const selectExistingProduct = (product: Product) => {
        // Handle price for variant products
        let price = product.selling_price;
        if ((price === undefined || price === null) && product.product_variants && product.product_variants.length > 0) {
            price = product.product_variants[0].selling_price;
        }

        const newProduct = {
            type: 'existing' as const,
            productId: product._id,
            name: product.name,
            thumbnail: product.image_url?.[0] || '/api/placeholder/60/60',
            quantity: 1,
            price: price || 0 // Store the product price
        };
        setFormData(prev => ({
            ...prev,
            products: [...prev.products, newProduct]
        }));
        setShowProductSearch(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // New product handlers
    const handleNewProductFormChange = (field: string, value: string | number | boolean) => {
        setNewProductForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNewProductThumbnail = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewProductForm(prev => ({
                ...prev,
                thumbnail: file
            }));
        }
    };

    const addNewProduct = async () => {
        if (!newProductForm.name.trim() || !newProductForm.thumbnail || !newProductForm.stock) {
            alert('Please fill in all required fields for the new product');
            return;
        }

        let thumbnailUrl = '/api/placeholder/60/60';
        let loadingToastId: string | number | undefined;

        // Upload thumbnail to Firebase Storage immediately when adding product
        if (newProductForm.thumbnail instanceof File) {
            try {
                loadingToastId = toast.loading('Uploading product Image to Firebase...');
                thumbnailUrl = await uploadFile(newProductForm.thumbnail, 'combo-offers/product-thumbnails');

                // Dismiss loading toast and show success
                if (loadingToastId) {
                    toast.dismiss(loadingToastId);
                }
                toast.success('Product Image uploaded successfully!');
                console.log('Product Image uploaded to Firebase:', thumbnailUrl);
            } catch (error) {
                console.error('Error uploading product image:', error);
                if (loadingToastId) {
                    toast.dismiss(loadingToastId);
                }
                toast.error('Failed to upload product image');
                return;
            }
        }

        const newProduct = {
            type: 'new' as const,
            name: newProductForm.name.trim(),
            thumbnail: thumbnailUrl,
            stock: parseInt(newProductForm.stock),
            quantity: parseInt(newProductForm.quantity) || 1,
            basePrice: newProductForm.basePrice ? parseFloat(newProductForm.basePrice) : undefined,
        };

        setFormData(prev => ({
            ...prev,
            products: [...prev.products, newProduct]
        }));

        // Reset new product form and close dialog
        setNewProductForm({
            name: '',
            thumbnail: null,
            stock: '',
            quantity: '1',
            basePrice: ''
        });

        // Reset product type to close the dialog using functional update
        setProductType(prev => {
            console.log('Resetting productType from', prev, 'to null');
            return null;
        });

        // Also reset the product type dialog state
        setShowProductTypeDialog(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading combo offers...</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Typography variant="h2">Combo Offers Management</Typography>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} className="gap-2">
                        <FaPlus /> Add New Combo
                    </Button>
                )}
            </div>

            {isEditing && (
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-sm border-0">
                        <CardHeader className="border-b bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-semibold text-gray-900">
                                    {currentOffer ? 'Edit Combo Offer' : 'Add New Combo Offer'}
                                </CardTitle>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetForm}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes size={20} />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Basic Information Section */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                                Title
                                            </Label>
                                            <Input
                                                id="title"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                placeholder="Couple Travel Pack"
                                                className="h-11"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                                Description
                                            </Label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                placeholder="2 Premium Backpacks + 1 Duffle Bag"
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Products Section */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Include Products</h3>

                                    <div className="space-y-3">
                                        {formData.products.map((product, index) => (
                                            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                                <img src={product.thumbnail} alt={product.name} className="w-12 h-12 rounded object-cover" />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900">{product.name}</span>
                                                        {product.type === 'new' && (
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                                                NEW
                                                            </span>
                                                        )}
                                                    </div>

                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateProductQuantity(index, Math.max(1, product.quantity - 1))}
                                                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-12 text-center font-medium">{product.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateProductQuantity(index, product.quantity + 1)}
                                                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeProduct(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <FaTrash size={14} />
                                                </Button>
                                            </div>
                                        ))}

                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={openProductTypeDialog}
                                            className="w-full border-dashed border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                                        >
                                            <FaPlus className="mr-2" /> Add Product to Combo
                                        </Button>
                                    </div>
                                </div>

                                {/* Pricing Section */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Pricing</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-2">
                                                Original Price (₹) <span className="text-xs text-gray-500">(Auto-calculated from products)</span>
                                            </Label>
                                            <Input
                                                id="originalPrice"
                                                name="originalPrice"
                                                type="number"
                                                value={formData.originalPrice}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                className="h-11 bg-gray-50"
                                                required
                                                readOnly
                                                placeholder="Add products to calculate"
                                            />
                                            {formData.products.length > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Calculated from {formData.products.length} product(s)
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                                Offer Price (₹)
                                            </Label>
                                            <Input
                                                id="price"
                                                name="price"
                                                type="number"
                                                value={formData.price}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                                className="h-11"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {formData.price && formData.originalPrice && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                                            <FaPercent className="text-green-600 text-lg" />
                                            <span className="text-green-800 font-semibold">
                                                You save {calculateSavings()}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Visual Section */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Visual</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label className="block text-sm font-medium text-gray-700 mb-2">
                                                Upload Combo Image
                                            </Label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="comboImage"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor="comboImage"
                                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                                                >
                                                    {formData.comboImageUrl ? (
                                                        <div className="relative w-full h-full">
                                                            <img
                                                                src={formData.comboImageUrl}
                                                                alt="Current combo image"
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                                                                <div className="text-white text-center">
                                                                    <FaUpload className="mx-auto mb-2" />
                                                                    <span className="text-sm">Click to change image</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <FaUpload className="text-gray-400 mb-2" />
                                                            <span className="text-sm text-gray-600">Click to upload image</span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>
                                            {formData.comboImage && (
                                                <div className="mt-2 text-sm text-green-600">
                                                    Image selected: {formData.comboImage.name}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="badgeType" className="block text-sm font-medium text-gray-700 mb-2">
                                                Show Badges
                                            </Label>
                                            <select
                                                id="badgeType"
                                                name="badgeType"
                                                value={formData.badgeType}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent h-11"
                                            >
                                                <option value="LIMITED_TIME">LIMITED TIME</option>
                                                <option value="BEST_VALUE">BEST VALUE</option>
                                                <option value="HOT_SALE">HOT SALE</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Display Settings */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Display Settings</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id="showOnHomepage"
                                                    checked={formData.showOnHomepage}
                                                    onCheckedChange={(checked) =>
                                                        setFormData(prev => ({ ...prev, showOnHomepage: checked as boolean }))
                                                    }
                                                />
                                                <Label htmlFor="showOnHomepage" className="text-sm font-medium text-gray-700">
                                                    Show on Homepage
                                                </Label>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id="showOnOffersPage"
                                                    checked={formData.showOnOffersPage}
                                                    onCheckedChange={(checked) =>
                                                        setFormData(prev => ({ ...prev, showOnOffersPage: checked as boolean }))
                                                    }
                                                />
                                                <Label htmlFor="showOnOffersPage" className="text-sm font-medium text-gray-700">
                                                    Show on Offers Page
                                                </Label>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="displayPriority" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Display Priority
                                                </Label>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => adjustPriority(-1)}
                                                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                                    >
                                                        <FaChevronDown size={12} />
                                                    </button>
                                                    <Input
                                                        id="displayPriority"
                                                        name="displayPriority"
                                                        type="number"
                                                        value={formData.displayPriority}
                                                        onChange={handleInputChange}
                                                        min="0"
                                                        className="w-20 h-11 text-center"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => adjustPriority(1)}
                                                        className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                                                    >
                                                        <FaChevronUp size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id="isActive"
                                                    checked={formData.isActive}
                                                    onCheckedChange={(checked) =>
                                                        setFormData(prev => ({ ...prev, isActive: checked as boolean }))
                                                    }
                                                />
                                                <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                                    Status: Active
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Schedule Section */}
                                <div className="space-y-6">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Schedule</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                                                <FaCalendarAlt className="inline mr-2" />
                                                Start Date
                                            </Label>
                                            <Input
                                                id="startDate"
                                                name="startDate"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                className="h-11"
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                                                <FaCalendarAlt className="inline mr-2" />
                                                End Date
                                            </Label>
                                            <Input
                                                id="endDate"
                                                name="endDate"
                                                type="date"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                className="h-11"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-4 pt-6 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetForm}
                                        className="px-6 py-2"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="px-6 py-2 bg-rose-600 hover:bg-rose-700"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <FaSave className="mr-2 animate-spin" /> Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FaSave className="mr-2" /> Save Combo Offer
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {!isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {offers.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <div className="text-slate-400 text-lg mb-2">No combo offers found</div>
                            <div className="text-slate-500 text-sm">Create your first combo offer to get started</div>
                        </div>
                    ) : (
                        offers.map((offer) => (
                            <div key={offer._id} className="bg-white rounded-xl overflow-hidden border border-slate-200 group hover:border-green-500/50 transition-all relative">
                                {/* Full Height Image Section */}
                                <div className="h-48 bg-slate-100 relative overflow-hidden">
                                    {offer.comboImage ? (
                                        <img
                                            src={offer.comboImage}
                                            alt={offer.title}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="text-slate-400 text-center">
                                                <FaGift className="mx-auto text-4xl" />
                                                <div className="text-sm">No Image</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Badge */}
                                    <div className={`absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-lg ${offer.badgeType === 'LIMITED_TIME' ? 'bg-rose-600' :
                                        offer.badgeType === 'BEST_VALUE' ? 'bg-emerald-600' :
                                            'bg-orange-600'
                                        }`}>
                                        {offer.badgeType?.replace('_', ' ')}
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-slate-900">{offer.title}</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(offer)}
                                                className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-green-100 hover:text-green-600 transition-colors"
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(offer._id)}
                                                className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-slate-600 mb-4 text-sm line-clamp-2">{offer.description}</p>

                                    <div className="flex items-baseline mb-4">
                                        <span className="text-3xl font-bold text-slate-900">₹{offer.price.toLocaleString()}</span>
                                        <span className="text-lg text-slate-400 line-through ml-3">₹{offer.originalPrice.toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold border border-emerald-200">
                                            Save {offer.savingsPercent}%
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${offer.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {offer.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    <div className="mt-3 text-xs text-slate-500 flex justify-between">
                                        <span>Priority: {offer.displayPriority}</span>
                                        <span>{offer.products?.length || 0} Products</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Product Type Selection Dialog */}
            {showProductTypeDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">Add Product Type</h3>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="productType"
                                    value="existing"
                                    onChange={() => setProductType('existing')}
                                    className="w-4 h-4 text-rose-600"
                                />
                                <span>Select Existing Product</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="productType"
                                    value="new"
                                    onChange={() => setProductType('new')}
                                    className="w-4 h-4 text-rose-600"
                                />
                                <span>Create New Combo Product</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowProductTypeDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={() => productType && selectProductType(productType)}
                                disabled={!productType}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Existing Product Search Modal */}
            {showProductSearch && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-hidden">
                        <h3 className="text-lg font-semibold mb-4">Search Products</h3>
                        <input
                            type="text"
                            placeholder="Search by name or SKU..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent mb-4"
                            autoFocus
                        />
                        <div className="max-h-64 overflow-y-auto">
                            {loadingSearch ? (
                                <div className="text-center py-4">Searching...</div>
                            ) : searchResults.length > 0 ? (
                                <div className="space-y-2">
                                    {searchResults.map((product: Product) => (
                                        <div
                                            key={product._id}
                                            onClick={() => selectExistingProduct(product)}
                                            className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={product.image_url?.[0] || '/api/placeholder/40/40'}
                                                    alt={product.name}
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                                <div>
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : searchQuery ? (
                                <div className="text-center py-4 text-gray-500">No products found</div>
                            ) : (
                                <div className="text-center py-4 text-gray-500">Enter search query</div>
                            )}
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowProductSearch(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Product Form */}
            {productType === 'new' && !showProductSearch && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Create New Combo Product</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={newProductForm.name}
                                    onChange={(e) => handleNewProductFormChange('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Custom Pack Mug"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleNewProductThumbnail}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                                <input
                                    type="number"
                                    value={newProductForm.stock}
                                    onChange={(e) => handleNewProductFormChange('stock', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="50"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (optional)</label>
                                <input
                                    type="number"
                                    value={newProductForm.basePrice}
                                    onChange={(e) => handleNewProductFormChange('basePrice', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="For cost breakdown"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setProductType(null);
                                    setNewProductForm({
                                        name: '',
                                        thumbnail: null,
                                        stock: '',
                                        quantity: '1',
                                        basePrice: ''
                                    });
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={addNewProduct}
                            >
                                Add Product
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}