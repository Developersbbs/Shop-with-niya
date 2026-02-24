'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaImage, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Typography from '@/components/ui/typography';
import { addOfferPopup, updateOfferPopup, deleteOfferPopup, toggleOfferPopup } from '@/actions/offer-popups';

interface OfferPopup {
    _id: string;
    heading: string;
    description: string;
    buttonText: string;
    buttonLink: string;
    image: string;
    isActive: boolean;
    priority: number;
    startDate?: string;
    endDate?: string;
    createdAt: string;
    updatedAt: string;
    linked_offer: string;
}

export default function OfferPopupsPage() {
    const [popups, setPopups] = useState<OfferPopup[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPopup, setCurrentPopup] = useState<OfferPopup | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [linkedOffer, setLinkedOffer] = useState<string | null>(null);


    // Form state
    const [formData, setFormData] = useState({
        heading: '',
        description: '',
        buttonText: 'Shop Now',
        buttonLink: '/products',
        isActive: true,
        priority: 0,
        startDate: '',
        endDate: ''
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

    useEffect(() => {
        fetchPopups();
        fetchOffers();
    }, []);

    const fetchPopups = async () => {
        try {
            const res = await fetch(`${baseUrl}/offer-popups/admin`);
            const data = await res.json();
            if (data.success) {
                setPopups(data.data);
            }
        } catch (error) {
            console.error('Error fetching popups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOffers = async () => {
        try {
            const res = await fetch(`${baseUrl}/offers`);
            const data = await res.json();
            if (data.success) {
                setOffers(data.data);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Auto-update button link when linked offer changes
    useEffect(() => {
        if (linkedOffer) {
            const selectedOffer = offers.find(offer => offer._id === linkedOffer);
            if (selectedOffer && selectedOffer.slug) {
                setFormData(prev => ({
                    ...prev,
                    buttonLink: `/offers/${selectedOffer.slug}`
                }));
            }
        } else {
            // Reset to default when no offer is selected
            setFormData(prev => ({
                ...prev,
                buttonLink: '/products'
            }));
        }
    }, [linkedOffer, offers]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setLinkedOffer(null);
        setFormData({
            heading: '',
            description: '',
            buttonText: 'Shop Now',
            buttonLink: '/products',
            isActive: true,
            priority: 0,
            startDate: '',
            endDate: ''
        });
        setImageFile(null);
        setImagePreview(null);
        setIsEditing(false);
        setCurrentPopup(null);
    };

    const handleEdit = (popup) => {
        setCurrentPopup(popup);
        setLinkedOffer(popup.linked_offer || null);
        setFormData({
            heading: popup.heading,
            description: popup.description || '',
            buttonText: popup.buttonText || 'Shop Now',
            buttonLink: popup.buttonLink || '/products',
            isActive: popup.isActive,
            priority: popup.priority || 0,
            startDate: popup.startDate ? new Date(popup.startDate).toISOString().split('T')[0] : '',
            endDate: popup.endDate ? new Date(popup.endDate).toISOString().split('T')[0] : ''
        });
        setImagePreview(popup.image);
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this offer popup?')) return;

        try {
            const result = await deleteOfferPopup(id);
            if (result.success) {
                fetchPopups();
                alert(result.message || 'Popup deleted successfully!');
            } else {
                // Handle validation errors
                if (result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join('\n');
                    alert(`Validation errors:\n${errorMessages}`);
                } else {
                    alert(result.message || 'Failed to delete popup');
                }
            }
        } catch (error) {
            console.error('Error deleting popup:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error deleting popup: ${errorMessage}`);
        }
    };

    const handleToggle = async (id) => {
        try {
            const result = await toggleOfferPopup(id);
            if (result.success) {
                fetchPopups();
            } else {
                // Handle validation errors
                if (result.errors) {
                    const errorMessages = Object.values(result.errors).flat().join('\n');
                    alert(`Validation errors:\n${errorMessages}`);
                } else {
                    alert(result.message || 'Failed to toggle popup');
                }
            }
        } catch (error) {
            console.error('Error toggling popup:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error toggling popup: ${errorMessage}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!imageFile && !currentPopup) {
            alert('Please upload an image');
            return;
        }

        setIsSaving(true); // Start saving state

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('heading', formData.heading);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('buttonText', formData.buttonText);
            formDataToSend.append('buttonLink', formData.buttonLink);
            formDataToSend.append('isActive', formData.isActive);
            formDataToSend.append('priority', formData.priority);
            if (formData.startDate) formDataToSend.append('startDate', formData.startDate);
            if (formData.endDate) formDataToSend.append('endDate', formData.endDate);
            if (linkedOffer) formDataToSend.append('linked_offer', linkedOffer);
            if (imageFile) formDataToSend.append('image', imageFile);

            let result;
            if (isEditing && currentPopup) {
                result = await updateOfferPopup(currentPopup._id, formDataToSend);
            } else {
                result = await addOfferPopup(formDataToSend);
            }

            if (result.success) {
                fetchPopups();
                resetForm();
                alert(result.message || 'Offer popup saved successfully!');
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
            console.error('Error saving popup:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error saving popup: ${errorMessage}`);
        } finally {
            setIsSaving(false); // End saving state
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <Typography variant="h1">Offer Popups Management</Typography>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <FaPlus /> Add New Popup
                    </button>
                )}
            </div>

            {isEditing && (
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>
                                {currentPopup ? 'Edit Offer Popup' : 'Add New Offer Popup'}
                            </CardTitle>
                            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                                <FaTimes size={24} />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Image Upload */}
                            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    id="image"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                                <label htmlFor="image" className="cursor-pointer">
                                    {imagePreview ? (
                                        <div className="relative w-full h-64">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                fill
                                                className="object-contain rounded-lg"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <FaImage className="w-16 h-16 text-slate-400 mb-4" />
                                            <p className="text-muted-foreground font-medium">Click to upload offer image</p>
                                            <p className="text-sm text-muted-foreground/70 mt-2">PNG, JPG, GIF, WEBP up to 5MB</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Heading</label>
                                        <input
                                            type="text"
                                            name="heading"
                                            value={formData.heading}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div>
  <label className="block text-sm font-medium mb-1">
    Link to Offer (Optional)
  </label>
  <select
    value={linkedOffer || ''}
    onChange={(e) => setLinkedOffer(e.target.value || null)}
    className="w-full p-2 border-border rounded-lg"
  >
    <option value="">— No linked offer —</option>
    {offers.map((offer) => (
      <option key={offer._id} value={offer._id}>
        {offer.title}
      </option>
    ))}
  </select>
</div>


                                    <div>
                                        <label className="block text-sm font-medium mb-1">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Button Text</label>
                                        <input
                                            type="text"
                                            name="buttonText"
                                            value={formData.buttonText}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Button Link</label>
                                        <input
                                            type="text"
                                            name="buttonLink"
                                            value={formData.buttonLink}
                                            onChange={handleInputChange}
                                            placeholder="/products"
                                            className={`w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent ${linkedOffer ? 'bg-muted cursor-not-allowed' : ''}`}
                                            readOnly={!!linkedOffer}
                                        />
                                        {linkedOffer && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Auto-generated from linked offer slug
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Priority</label>
                                        <input
                                            type="number"
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Higher priority shows first</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Start Date (Optional)</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                        />
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
                                                    <FaSave /> Save Popup
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popups.map((popup) => (
                    <Card key={popup._id} className="overflow-hidden group hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                            <div className="relative h-48">
                                <Image
                                    src={popup.image}
                                    alt={popup.heading}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(popup)}
                                        className="p-2 bg-card/90 text-card-foreground rounded-full hover:bg-card hover:text-primary transition-colors"
                                    >
                                        <FaEdit size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(popup._id)}
                                        className="p-2 bg-card/90 text-card-foreground rounded-full hover:bg-card hover:text-destructive transition-colors"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    <h3 className="font-bold text-lg mb-2 truncate">{popup.heading}</h3>
                                    <p className="text-sm opacity-90 truncate">{popup.description}</p>
                                </div>
                            </div>
                            <div className="p-4 flex justify-between items-center text-sm text-muted-foreground">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${popup.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    {popup.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span>Priority: {popup.priority}</span>
                                    <button
                                        onClick={() => handleToggle(popup._id)}
                                        className="text-xl"
                                    >
                                        {popup.isActive ? (
                                            <FaToggleOn className="text-primary" />
                                        ) : (
                                            <FaToggleOff className="text-muted-foreground" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            )}

            {popups.length === 0 && !isEditing && (
                <div className="text-center py-12">
                    <FaImage className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <Typography variant="h3" className="text-muted-foreground">No offer popups yet</Typography>
                    <p className="text-muted-foreground/70 text-sm mt-2">Create your first popup to engage customers!</p>
                </div>
            )}
        </div>
    );
}