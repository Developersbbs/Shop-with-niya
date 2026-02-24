'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaImage, FaSave, FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Typography from '@/components/ui/typography';
import { addHeroSection, updateHeroSection, deleteHeroSection } from '@/actions/hero-section';

interface HeroSlide {
    _id: string;
    title: string;
    subtitle?: string;
    description?: string;
    image: string;
    imageMobile?: string;
    primaryCTA?: {
        text: string;
        link: string;
    };
    secondaryCTA?: {
        text: string;
        link: string;
    };
    gradient?: string;
    order: number;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
    views?: number;
    clicks?: number;
    templateType?: 'full' | 'center' | 'banner' | 'split';
    showOn?: 'all' | 'desktop' | 'mobile';
    isArchived?: boolean;
}

export default function HeroSectionPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSlide, setCurrentSlide] = useState<HeroSlide | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<{
        title: string;
        subtitle: string;
        description: string;
        primaryCTAText: string;
        primaryCTALink: string;
        secondaryCTAText: string;
        secondaryCTALink: string;
        gradient: string;
        isActive: boolean;
        templateType: 'full' | 'center' | 'banner' | 'split';
        showOn: 'all' | 'desktop' | 'mobile';
        startDate: string;
        endDate: string;
        order: number;
    }>({
        title: '',
        subtitle: '',
        description: '',
        primaryCTAText: 'Shop Now',
        primaryCTALink: '/products',
        secondaryCTAText: '',
        secondaryCTALink: '',
        gradient: 'from-black/90 via-black/40 to-transparent',
        isActive: true,
        templateType: 'center',
        showOn: 'all',
        startDate: '',
        endDate: '',
        order: 0
    });

    // Fix: Ensure API_URL always includes /api
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

    console.log('API_URL:', API_URL);
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const res = await fetch(`${API_URL}/hero-section/admin`);
            const data = await res.json();
            if (data.success) {
                setSlides(data.data);
            }
        } catch (error) {
            console.error('Error fetching slides:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) || 0 : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            primaryCTAText: 'Shop Now',
            primaryCTALink: '/products',
            secondaryCTAText: '',
            secondaryCTALink: '',
            gradient: 'from-black/90 via-black/40 to-transparent',
            isActive: true,
            templateType: 'center',
            showOn: 'all',
            startDate: '',
            endDate: '',
            order: 0
        });
        setImageFile(null);
        setPreviewUrl('');
        setIsEditing(false);
        setCurrentSlide(null);
    };

    const handleEdit = (slide) => {
        setCurrentSlide(slide);
        setFormData({
            title: slide.title,
            subtitle: slide.subtitle || '',
            description: slide.description || '',
            primaryCTAText: slide.primaryCTA?.text || 'Shop Now',
            primaryCTALink: slide.primaryCTA?.link || '/products',
            secondaryCTAText: slide.secondaryCTA?.text || '',
            secondaryCTALink: slide.secondaryCTA?.link || '',
            gradient: slide.gradient || 'from-black/90 via-black/40 to-transparent',
            isActive: slide.isActive,
            templateType: slide.templateType || 'center',
            showOn: slide.showOn || 'all',
            startDate: slide.startDate ? new Date(slide.startDate).toISOString().split('T')[0] : '',
            endDate: slide.endDate ? new Date(slide.endDate).toISOString().split('T')[0] : '',
            order: slide.order || 0
        });
        const normalizedImage = slide.image?.startsWith('http')
            ? slide.image
            : `${API_URL.replace('/api', '')}${slide.image}`;
        setPreviewUrl(normalizedImage);
        setIsEditing(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this slide?')) return;

        try {
            const result = await deleteHeroSection(id);
            if (result.success) {
                fetchSlides();
                alert('Slide deleted successfully!');
            } else {
                alert(result.message || 'Failed to delete slide');
            }
        } catch (error) {
            console.error('Error deleting slide:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error deleting slide: ${errorMessage}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsSaving(true); // Start saving state

        const data = new FormData();
        
        // Handle basic fields
        data.append('title', formData.title);
        data.append('subtitle', formData.subtitle);
        data.append('description', formData.description);
        data.append('gradient', formData.gradient);
        data.append('isActive', formData.isActive.toString());
        data.append('order', formData.order.toString());
        data.append('templateType', formData.templateType);
        data.append('showOn', formData.showOn);
        
        // Handle scheduling dates
        if (formData.startDate) {
            data.append('startDate', formData.startDate);
        }
        if (formData.endDate) {
            data.append('endDate', formData.endDate);
        }
        
        // Handle CTA structure
        const primaryCTA = {
            text: formData.primaryCTAText,
            link: formData.primaryCTALink
        };
        data.append('primaryCTA', JSON.stringify(primaryCTA));
        
        if (formData.secondaryCTAText && formData.secondaryCTALink) {
            const secondaryCTA = {
                text: formData.secondaryCTAText,
                link: formData.secondaryCTALink
            };
            data.append('secondaryCTA', JSON.stringify(secondaryCTA));
        }

        if (imageFile) {
            data.append('image', imageFile);
        }

        // Add existing image URL for updates
        if (isEditing && currentSlide && currentSlide.image) {
            data.append('existingImage', currentSlide.image);
        }

        try {
            let result;
            if (isEditing && currentSlide) {
                result = await updateHeroSection(currentSlide._id, data);
            } else {
                result = await addHeroSection(data);
            }

            if (result.success) {
                fetchSlides();
                resetForm();
                alert(result.message || 'Slide saved successfully!');
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
            console.error('Error saving slide:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error saving slide: ${errorMessage}`);
        } finally {
            setIsSaving(false); // End saving state
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <Typography variant="h1">Hero Section Management</Typography>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <FaPlus /> Add New Slide
                    </button>
                )}
            </div>

            {isEditing && (
                <Card className="mb-8">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>
                                {currentSlide ? 'Edit Slide' : 'Add New Slide'}
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
                                <label className="block text-sm font-medium mb-1">Subtitle</label>
                                <input
                                    type="text"
                                    name="subtitle"
                                    value={formData.subtitle}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            {/* Enhanced CTA Options */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Enhanced CTA Options</h4>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Primary CTA Text</label>
                                            <input
                                                type="text"
                                                name="primaryCTAText"
                                                value={formData.primaryCTAText}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Primary CTA Link</label>
                                            <input
                                                type="text"
                                                name="primaryCTALink"
                                                value={formData.primaryCTALink}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Secondary CTA Text</label>
                                            <input
                                                type="text"
                                                name="secondaryCTAText"
                                                value={formData.secondaryCTAText}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                                placeholder="Optional"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Secondary CTA Link</label>
                                            <input
                                                type="text"
                                                name="secondaryCTALink"
                                                value={formData.secondaryCTALink}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Template & Display Options */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Template & Display</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Template Type</label>
                                        <select
                                            name="templateType"
                                            value={formData.templateType}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                        >
                                            <option value="center">Center</option>
                                            <option value="full">Full Screen</option>
                                            <option value="banner">Banner</option>
                                            <option value="split">Split</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Show On</label>
                                        <select
                                            name="showOn"
                                            value={formData.showOn}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                        >
                                            <option value="all">All Devices</option>
                                            <option value="desktop">Desktop Only</option>
                                            <option value="mobile">Mobile Only</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Background Image</label>
                                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        id="image-upload"
                                    />
                                    <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                                        {previewUrl ? (
                                            <div className="relative w-full h-48 mb-2">
                                                <Image
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    fill
                                                    className="object-cover rounded-lg"
                                                />
                                            </div>
                                        ) : (
                                            <FaImage className="w-12 h-12 text-muted-foreground mb-2" />
                                        )}
                                        <span className="text-sm text-muted-foreground">Click to upload image</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Gradient Overlay</label>
                                <select
                                    name="gradient"
                                    value={formData.gradient}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                >
                                    <option value="from-black/90 via-black/40 to-transparent">Black Fade</option>
                                    <option value="from-slate-900/90 via-slate-900/40 to-transparent">Slate Fade</option>
                                    <option value="from-primary/90 via-primary/40 to-transparent">Primary Fade</option>
                                    <option value="from-blue-900/90 via-blue-900/40 to-transparent">Blue Fade</option>
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

                            {/* Scheduling */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Scheduling (Optional)</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">End Date</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Order */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Display Order</label>
                                <input
                                    type="number"
                                    name="order"
                                    value={formData.order}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Lower numbers show first</p>
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
                                            <FaSave /> Save Slide
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
                {slides.map((slide) => (
                    <Card key={slide._id} className="overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="relative h-48">
                            <Image
                                src={slide.image?.startsWith('http') ? slide.image : `${API_URL.replace('/api', '')}${slide.image}`}
                                alt={slide.title}
                                fill
                                className="object-cover"
                            />
                            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`}></div>
                            <div className="absolute bottom-4 left-4 right-4 text-white">
                                <h3 className="font-bold text-lg truncate">{slide.title}</h3>
                                <p className="text-sm opacity-90 truncate">{slide.subtitle}</p>
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(slide)}
                                    className="p-2 bg-card/90 text-card-foreground rounded-full hover:bg-card hover:text-primary transition-colors"
                                >
                                    <FaEdit size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(slide._id)}
                                    className="p-2 bg-card/90 text-card-foreground rounded-full hover:bg-card hover:text-destructive transition-colors"
                                >
                                    <FaTrash size={14} />
                                </button>
                            </div>
                        </div>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs ${slide.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                    {slide.isActive ? 'Active' : 'Inactive'}
                                </span>
                                <span className="text-xs">Order: {slide.order}</span>
                            </div>
                            
                            {/* Template and Device Info */}
                            <div className="flex gap-2 text-xs text-muted-foreground mb-2">
                                <span className="px-2 py-0.5 bg-muted rounded">{slide.templateType || 'center'}</span>
                                <span className="px-2 py-0.5 bg-muted rounded">{slide.showOn || 'all'}</span>
                                {slide.isArchived && <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded">Archived</span>}
                            </div>
                            
                            {/* Scheduling Info */}
                            {(slide.startDate || slide.endDate) && (
                                <div className="text-xs text-muted-foreground mb-2">
                                    {slide.startDate && <span>From: {new Date(slide.startDate).toLocaleDateString()}</span>}
                                    {slide.endDate && <span> • Until: {new Date(slide.endDate).toLocaleDateString()}</span>}
                                </div>
                            )}
                            
                            {/* Analytics */}
                            <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                <span>Views: {slide.views || 0}</span>
                                <span>Clicks: {slide.clicks || 0}</span>
                            </div>
                            
                            {/* CTA Info */}
                            <div className="text-xs text-muted-foreground mb-2">
                                <div className="truncate">Primary: {slide.primaryCTA?.text || 'Shop Now'}</div>
                                {slide.secondaryCTA?.text && <div className="truncate">Secondary: {slide.secondaryCTA.text}</div>}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{slide.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
            )}
            
            {slides.length === 0 && !isEditing && (
                <div className="text-center py-12">
                    <FaImage className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <Typography variant="h3" className="text-muted-foreground">No hero slides yet</Typography>
                    <p className="text-muted-foreground/70 text-sm mt-2">Create your first slide to showcase your products!</p>
                </div>
            )}
        </div>
    );
}