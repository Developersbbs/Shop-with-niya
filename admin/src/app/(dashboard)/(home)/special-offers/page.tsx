'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaGift, FaTruck, FaShieldAlt, FaCreditCard, FaStar, FaHeadset } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Typography from '@/components/ui/typography';
import { addSpecialOffer, updateSpecialOffer, deleteSpecialOffer } from '@/actions/special-offers';

// Predefined icon options
const ICON_OPTIONS = [
    { name: 'Gift', component: FaGift },
    { name: 'Truck', component: FaTruck },
    { name: 'Shield', component: FaShieldAlt },
    { name: 'Credit Card', component: FaCreditCard },
    { name: 'Star', component: FaStar },
    { name: 'Headset', component: FaHeadset }
];

interface SpecialOffer {
    _id: string;
    title: string;
    description: string;
    icon: string;
    bgColor: string;
    order: number;
    isActive: boolean;
}

export default function SpecialOffersPage() {
    const [offers, setOffers] = useState<SpecialOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentOffer, setCurrentOffer] = useState<SpecialOffer | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: 'FaGift',
        bgColor: 'from-rose-50 to-rose-100',
        isActive: true
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

    const fetchOffers = useCallback(async () => {
        try {
            const res = await fetch(`${baseUrl}/special-offers/admin`);
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
        const { name, value, type } = e.target as HTMLInputElement;
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
            icon: 'FaGift',
            bgColor: 'from-rose-50 to-rose-100',
            isActive: true
        });
        setIsEditing(false);
        setCurrentOffer(null);
    };

    const handleEdit = (offer: SpecialOffer) => {
        setCurrentOffer(offer);
        setFormData({
            title: offer.title,
            description: offer.description || '',
            icon: offer.icon || 'FaGift',
            bgColor: offer.bgColor || 'from-rose-50 to-rose-100',
            isActive: offer.isActive
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this offer?')) return;

        try {
            const result = await deleteSpecialOffer(id);
            if (result.success) {
                fetchOffers();
                alert(result.message || 'Offer deleted successfully!');
            } else {
                // Handle validation errors
                if (result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join('\n');
                    alert(`Validation errors:\n${errorMessages}`);
                } else {
                    alert(result.message || 'Failed to delete offer');
                }
            }
        } catch (error) {
            console.error('Error deleting offer:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error deleting offer: ${errorMessage}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSaving(true); // Start saving state

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            const value = formData[key as keyof typeof formData];
            if (typeof value === 'boolean') {
                data.append(key, value.toString());
            } else {
                data.append(key, value);
            }
        });

        try {
            let result;
            if (isEditing && currentOffer) {
                result = await updateSpecialOffer(currentOffer._id, data);
            } else {
                result = await addSpecialOffer(data);
            }

            if (result.success) {
                fetchOffers();
                resetForm();
                alert(result.message || 'Offer saved successfully!');
            } else {
                // Handle validation errors
                if (result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join('\n');
                    alert(`Validation errors:\n${errorMessages}`);
                } else {
                    alert(result.message || 'Operation failed');
                }
            }
        } catch (error) {
            console.error('Error saving offer:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error saving offer: ${errorMessage}`);
        } finally {
            setIsSaving(false); // End saving state
        }
    };

    const getIconComponent = (iconName: string) => {
        const icon = ICON_OPTIONS.find(opt => opt.component.name === iconName);
        return icon ? icon.component : FaGift;
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <Typography variant="h1">Special Offers Management</Typography>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <FaPlus /> Add New Offer
                    </button>
                )}
            </div>

            {isEditing && (
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>
                                {currentOffer ? 'Edit Offer' : 'Add New Offer'}
                            </CardTitle>
                            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                                <FaTimes size={24} />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Icon</label>
                                    <select
                                        name="icon"
                                        value={formData.icon}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                    >
                                        {ICON_OPTIONS.map(icon => (
                                            <option key={icon.component.name} value={icon.component.name}>
                                                {icon.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium mb-1">Background Color</label>
                                    <select
                                        name="bgColor"
                                        value={formData.bgColor}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                    >
                                        <option value="from-rose-50 to-rose-100">Rose</option>
                                        <option value="from-blue-50 to-blue-100">Blue</option>
                                        <option value="from-green-50 to-green-100">Green</option>
                                        <option value="from-purple-50 to-purple-100">Purple</option>
                                        <option value="from-amber-50 to-amber-100">Amber</option>
                                        <option value="from-slate-50 to-slate-100">Gray</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        id="isActive"
                                        className="w-4 h-4 text-primary rounded focus:ring-ring"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FaSave /> Save Offer
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {!isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.map((offer) => {
                        const IconComponent = getIconComponent(offer.icon);
                        return (
                            <Card key={offer._id} className="overflow-hidden group hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 bg-gradient-to-r ${offer.bgColor} rounded-lg`}>
                                            <IconComponent className="w-8 h-8 text-rose-600" />
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(offer)}
                                                className="p-2 bg-card/90 text-card-foreground rounded-full hover:bg-card hover:text-primary transition-colors"
                                            >
                                                <FaEdit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(offer._id)}
                                                className="p-2 bg-card/90 text-card-foreground rounded-full hover:bg-card hover:text-destructive transition-colors"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">{offer.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">{offer.description}</p>
                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${offer.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            {offer.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span>Order: {offer.order}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {offers.length === 0 && !isEditing && (
                <div className="text-center py-12">
                    <FaGift className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <Typography variant="h3" className="text-muted-foreground">No special offers yet</Typography>
                    <p className="text-muted-foreground/70 text-sm mt-2">Create your first offer to highlight special deals!</p>
                </div>
            )}
        </div>
    );
}