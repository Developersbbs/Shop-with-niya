'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Typography from '@/components/ui/typography';
import { cn } from '@/lib/utils';
import { addMarqueeOffer, updateMarqueeOffer, deleteMarqueeOffer } from '@/actions/marquee-offers';

interface MarqueeOffer {
    _id: string;
    title: string;
    description: string;
    icon: string;
    order: number;
    isActive: boolean;
}

export default function MarqueeOffersPage() {
    const [offers, setOffers] = useState<MarqueeOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentOffer, setCurrentOffer] = useState<MarqueeOffer | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: '',
        isActive: true
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

    // Common emojis for quick selection
    const commonEmojis = ['🚚', '🎁', '🔥', '✨', '↩️', '💰', '⚡', '🎉', '🏆', '💎', '🌟', '🎯'];

    useEffect(() => {
        fetchOffers();
    }, []);

    const fetchOffers = async () => {
        try {
            const res = await fetch(`${baseUrl}/marquee-offers/admin`);
            const data = await res.json();
            if (data.success) {
                setOffers(data.data);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            icon: '',
            isActive: true
        });
        setIsEditing(false);
        setCurrentOffer(null);
    };

    const handleEdit = (offer) => {
        setCurrentOffer(offer);
        setFormData({
            title: offer.title,
            description: offer.description || '',
            icon: offer.icon,
            isActive: offer.isActive
        });
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this marquee offer?')) return;

        try {
            const result = await deleteMarqueeOffer(id);
            
            if (result.success) {
                fetchOffers();
                alert(result.message || 'Marquee offer deleted successfully!');
            } else {
                alert(result.message || 'Failed to delete offer');
            }
        } catch (error) {
            console.error('Error deleting offer:', error);
            alert('Error deleting offer');
        }
    };

    const reorderOffers = async () => {
        try {
            // Get all offers and sort by current order
            const res = await fetch(`${baseUrl}/marquee-offers/admin`);
            const data = await res.json();
            
            if (data.success) {
                const sortedOffers = data.data.sort((a: MarqueeOffer, b: MarqueeOffer) => a.order - b.order);
                
                // Update each offer with new order (0, 1, 2, ...)
                const updatePromises = sortedOffers.map((offer: MarqueeOffer, index: number) => {
                    return fetch(`${baseUrl}/marquee-offers/${offer._id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            ...offer,
                            order: index
                        })
                    });
                });
                
                await Promise.all(updatePromises);
            }
        } catch (error) {
            console.error('Error reordering offers:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Create FormData for server action
            const serverFormData = new FormData();
            serverFormData.append('title', formData.title);
            serverFormData.append('description', formData.description);
            serverFormData.append('icon', formData.icon);
            serverFormData.append('isActive', formData.isActive.toString());

            let result;
            if (isEditing && currentOffer) {
                result = await updateMarqueeOffer(currentOffer._id, serverFormData);
            } else {
                result = await addMarqueeOffer(serverFormData);
            }

            if (result.success) {
                fetchOffers();
                resetForm();
                alert(result.message || 'Marquee offer saved successfully!');
            } else {
                alert(result.message || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving offer:', error);
            alert(`Error saving offer: ${error.message}`);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading offers...</div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Typography variant="h2">Marquee Offers Management</Typography>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} className="gap-2">
                        <FaPlus /> Add New Offer
                    </Button>
                )}
            </div>

            {isEditing && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>
                                {currentOffer ? 'Edit Marquee Offer' : 'Add New Marquee Offer'}
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={resetForm}>
                                <FaTimes className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Free Shipping"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="e.g., On orders above ₹999"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="icon">Icon/Emoji</Label>
                                    <Input
                                        id="icon"
                                        name="icon"
                                        value={formData.icon}
                                        onChange={handleInputChange}
                                        placeholder="Enter emoji"
                                        maxLength="2"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isActive"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) => 
                                            setFormData(prev => ({ ...prev, isActive: Boolean(checked) }))
                                        }
                                    />
                                    <Label htmlFor="isActive">Active</Label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="gap-2">
                                    <FaSave /> Save Offer
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map((offer) => (
                    <Card key={offer._id} className="group hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-2xl">
                                        {offer.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{offer.title}</h3>
                                        <p className="text-sm text-muted-foreground">{offer.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(offer)}
                                        className="h-8 w-8"
                                    >
                                        <FaEdit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(offer._id)}
                                        className="h-8 w-8 hover:text-destructive"
                                    >
                                        <FaTrash className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-xs font-medium",
                                    offer.isActive 
                                        ? "bg-primary/10 text-primary" 
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {offer.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="text-muted-foreground">Order: {offer.order}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}