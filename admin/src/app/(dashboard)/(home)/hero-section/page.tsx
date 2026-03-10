'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEdit, FaImage, FaSave, FaTimes, FaMobileAlt, FaDesktop } from 'react-icons/fa';
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
    primaryCTA?: { text: string; link: string; };
    secondaryCTA?: { text: string; link: string; };
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
    textColor?: string;
    buttonStyle?: 'filled' | 'outline' | 'ghost';
    buttonColor?: string;
    buttonTextColor?: string;
}

export default function HeroSectionPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSlide, setCurrentSlide] = useState<HeroSlide | null>(null);

    // Desktop image
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // Mobile image
    const [imageMobileFile, setImageMobileFile] = useState<File | null>(null);
    const [previewMobileUrl, setPreviewMobileUrl] = useState('');

    const [isSaving, setIsSaving] = useState(false);

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
        textColor: string;
        buttonStyle: 'filled' | 'outline' | 'ghost';
        buttonColor: string;
        buttonTextColor: string;
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
        order: 0,
        textColor: '#ffffff',
        buttonStyle: 'filled',
        buttonColor: '#ffffff',
        buttonTextColor: '#0a0a0a',
    });

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const API_URL = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

    useEffect(() => { fetchSlides(); }, []);

    const fetchSlides = async () => {
        try {
            const res = await fetch(`${API_URL}/hero-section/admin`);
            const data = await res.json();
            if (data.success) setSlides(data.data);
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

    const handleMobileImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageMobileFile(file);
            setPreviewMobileUrl(URL.createObjectURL(file));
        }
    };

    const removeMobileImage = () => {
        setImageMobileFile(null);
        setPreviewMobileUrl('');
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
            order: 0,
            textColor: '#ffffff',
            buttonStyle: 'filled',
            buttonColor: '#ffffff',
            buttonTextColor: '#0a0a0a',
        });
        setImageFile(null);
        setPreviewUrl('');
        setImageMobileFile(null);
        setPreviewMobileUrl('');
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
            order: slide.order || 0,
            textColor: slide.textColor || '#ffffff',
            buttonStyle: slide.buttonStyle || 'filled',
            buttonColor: slide.buttonColor || '#ffffff',
            buttonTextColor: slide.buttonTextColor || '#0a0a0a',
        });

        // Desktop image
        const normalizedImage = slide.image?.startsWith('http')
            ? slide.image
            : `${API_URL.replace('/api', '')}${slide.image}`;
        setPreviewUrl(normalizedImage);

        // Mobile image
        if (slide.imageMobile) {
            const normalizedMobileImage = slide.imageMobile?.startsWith('http')
                ? slide.imageMobile
                : `${API_URL.replace('/api', '')}${slide.imageMobile}`;
            setPreviewMobileUrl(normalizedMobileImage);
        } else {
            setPreviewMobileUrl('');
        }

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
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error deleting slide: ${errorMessage}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        const data = new FormData();
        data.append('title', formData.title);
        data.append('subtitle', formData.subtitle);
        data.append('description', formData.description);
        data.append('gradient', formData.gradient);
        data.append('isActive', formData.isActive.toString());
        data.append('order', formData.order.toString());
        data.append('templateType', formData.templateType);
        data.append('showOn', formData.showOn);
        data.append('textColor', formData.textColor);
        data.append('buttonStyle', formData.buttonStyle);
        data.append('buttonColor', formData.buttonColor);
        data.append('buttonTextColor', formData.buttonTextColor);

        if (formData.startDate) data.append('startDate', formData.startDate);
        if (formData.endDate) data.append('endDate', formData.endDate);

        data.append('primaryCTA', JSON.stringify({
            text: formData.primaryCTAText,
            link: formData.primaryCTALink
        }));

        if (formData.secondaryCTAText && formData.secondaryCTALink) {
            data.append('secondaryCTA', JSON.stringify({
                text: formData.secondaryCTAText,
                link: formData.secondaryCTALink
            }));
        }

        // Desktop image
        if (imageFile) data.append('image', imageFile);
        if (isEditing && currentSlide?.image) data.append('existingImage', currentSlide.image);

        // Mobile image
        if (imageMobileFile) data.append('imageMobile', imageMobileFile);
        if (isEditing && currentSlide?.imageMobile) data.append('existingImageMobile', currentSlide.imageMobile);
        // Flag to remove mobile image if it was cleared
        if (isEditing && currentSlide?.imageMobile && !previewMobileUrl && !imageMobileFile) {
            data.append('removeMobileImage', 'true');
        }

        try {
            const result = isEditing && currentSlide
                ? await updateHeroSection(currentSlide._id, data)
                : await addHeroSection(data);

            if (result.success) {
                fetchSlides();
                resetForm();
                alert(result.message || 'Slide saved successfully!');
            } else {
                if (result.errors) {
                    alert(`Validation errors:\n${Object.values(result.errors).flat().join('\n')}`);
                } else {
                    alert(result.message || 'Operation failed');
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Error saving slide: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Live button preview helper
    const getButtonPreviewStyle = () => {
        const base = {
            padding: '8px 20px',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            textTransform: 'uppercase' as const,
            display: 'inline-block',
            cursor: 'default',
            transition: 'all 0.2s',
        };
        if (formData.buttonStyle === 'filled') return { ...base, background: formData.buttonColor, color: formData.buttonTextColor, border: `2px solid ${formData.buttonColor}` };
        if (formData.buttonStyle === 'outline') return { ...base, background: 'transparent', color: formData.buttonColor, border: `2px solid ${formData.buttonColor}` };
        return { ...base, background: 'rgba(0,0,0,0.08)', color: formData.buttonColor, border: '2px solid transparent' };
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
                            <CardTitle>{currentSlide ? 'Edit Slide' : 'Add New Slide'}</CardTitle>
                            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                                <FaTimes size={24} />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* ── LEFT COLUMN ── */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input type="text" name="title" value={formData.title} onChange={handleInputChange}
                                        className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring"
                                        required />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Subtitle</label>
                                    <input type="text" name="subtitle" value={formData.subtitle} onChange={handleInputChange}
                                        className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange}
                                        rows={3} className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring" />
                                </div>

                                {/* CTA Options */}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">CTA Options</h4>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Primary CTA Text</label>
                                                <input type="text" name="primaryCTAText" value={formData.primaryCTAText} onChange={handleInputChange}
                                                    className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Primary CTA Link</label>
                                                <input type="text" name="primaryCTALink" value={formData.primaryCTALink} onChange={handleInputChange}
                                                    className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Secondary CTA Text</label>
                                                <input type="text" name="secondaryCTAText" value={formData.secondaryCTAText} onChange={handleInputChange}
                                                    className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring"
                                                    placeholder="Optional" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Secondary CTA Link</label>
                                                <input type="text" name="secondaryCTALink" value={formData.secondaryCTALink} onChange={handleInputChange}
                                                    className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring"
                                                    placeholder="Optional" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Template & Display */}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">Template & Display</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Template Type</label>
                                            <select name="templateType" value={formData.templateType} onChange={handleInputChange}
                                                className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring">
                                                <option value="center">Center</option>
                                                <option value="full">Full Screen</option>
                                                <option value="banner">Banner</option>
                                                <option value="split">Split</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Show On</label>
                                            <select name="showOn" value={formData.showOn} onChange={handleInputChange}
                                                className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring">
                                                <option value="all">All Devices</option>
                                                <option value="desktop">Desktop Only</option>
                                                <option value="mobile">Mobile Only</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ── TEXT & BUTTON STYLING ── */}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">Text & Button Style</h4>
                                    <div className="space-y-4">

                                        {/* Text Color */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Text Color</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" name="textColor" value={formData.textColor} onChange={handleInputChange}
                                                    className="w-10 h-10 rounded cursor-pointer border border-border p-0.5" />
                                                <input type="text" name="textColor" value={formData.textColor} onChange={handleInputChange}
                                                    className="flex-1 p-2 border border-border bg-background rounded-lg text-sm font-mono"
                                                    placeholder="#ffffff" />
                                                <div className="w-10 h-10 rounded border border-border flex items-center justify-center text-xs font-bold"
                                                    style={{ background: '#1a1a1a', color: formData.textColor }}>
                                                    Aa
                                                </div>
                                            </div>
                                        </div>

                                        {/* Button Style */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Button Style</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['filled', 'outline', 'ghost'] as const).map((style) => (
                                                    <button
                                                        key={style}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, buttonStyle: style }))}
                                                        className={`p-2 rounded-lg border-2 text-xs font-medium capitalize transition-all ${
                                                            formData.buttonStyle === style
                                                                ? 'border-primary bg-primary/10 text-primary'
                                                                : 'border-border text-muted-foreground hover:border-primary/50'
                                                        }`}
                                                    >
                                                        {style}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Button Color */}
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Button Color</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" name="buttonColor" value={formData.buttonColor} onChange={handleInputChange}
                                                    className="w-10 h-10 rounded cursor-pointer border border-border p-0.5" />
                                                <input type="text" name="buttonColor" value={formData.buttonColor} onChange={handleInputChange}
                                                    className="flex-1 p-2 border border-border bg-background rounded-lg text-sm font-mono"
                                                    placeholder="#ffffff" />
                                            </div>
                                        </div>

                                        {/* Button Text Color */}
                                        {formData.buttonStyle === 'filled' && (
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Button Text Color</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="color" name="buttonTextColor" value={formData.buttonTextColor} onChange={handleInputChange}
                                                        className="w-10 h-10 rounded cursor-pointer border border-border p-0.5" />
                                                    <input type="text" name="buttonTextColor" value={formData.buttonTextColor} onChange={handleInputChange}
                                                        className="flex-1 p-2 border border-border bg-background rounded-lg text-sm font-mono"
                                                        placeholder="#0a0a0a" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Live Button Preview */}
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Live Preview</label>
                                            <div className="p-4 rounded-lg bg-gray-800 flex items-center gap-3">
                                                <span style={getButtonPreviewStyle()}>
                                                    {formData.primaryCTAText || 'Shop Now'}
                                                </span>
                                                <p className="text-xs" style={{ color: formData.textColor, fontWeight: 600 }}>
                                                    Sample Title Text
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── RIGHT COLUMN ── */}
                            <div className="space-y-4">

                                {/* ── IMAGE UPLOADS SECTION ── */}
                                <div className="border rounded-xl p-4 space-y-4 bg-muted/30">
                                    <h4 className="font-medium flex items-center gap-2">
                                        <FaImage className="text-muted-foreground" /> Background Images
                                    </h4>

                                    {/* Desktop Image */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium mb-2">
                                            <FaDesktop size={13} className="text-muted-foreground" />
                                            Desktop Image
                                            <span className="text-xs text-muted-foreground font-normal">(recommended: 1920×1080)</span>
                                        </label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors">
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                                            <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                                                {previewUrl ? (
                                                    <div className="relative w-full h-40 mb-2">
                                                        <Image src={previewUrl} alt="Desktop Preview" fill className="object-cover rounded-lg" />
                                                    </div>
                                                ) : (
                                                    <FaDesktop className="w-10 h-10 text-muted-foreground mb-2" />
                                                )}
                                                <span className="text-sm text-muted-foreground">
                                                    {previewUrl ? 'Click to replace' : 'Click to upload desktop image'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 border-t border-border" />
                                        <span className="text-xs text-muted-foreground uppercase tracking-widest">Mobile</span>
                                        <div className="flex-1 border-t border-border" />
                                    </div>

                                    {/* Mobile Image */}
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium mb-1">
                                            <FaMobileAlt size={13} className="text-muted-foreground" />
                                            Mobile Image
                                            <span className="text-xs text-muted-foreground font-normal">(recommended: 750×1334)</span>
                                        </label>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            If not set, the desktop image will be used on mobile.
                                        </p>
                                        <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                                            previewMobileUrl ? 'border-primary/60' : 'border-border hover:border-primary'
                                        }`}>
                                            <input type="file" accept="image/*" onChange={handleMobileImageChange} className="hidden" id="image-mobile-upload" />
                                            <label htmlFor="image-mobile-upload" className="cursor-pointer flex flex-col items-center">
                                                {previewMobileUrl ? (
                                                    <div className="relative mx-auto mb-2" style={{ width: 80, height: 140 }}>
                                                        <Image src={previewMobileUrl} alt="Mobile Preview" fill className="object-cover rounded-lg" />
                                                    </div>
                                                ) : (
                                                    <FaMobileAlt className="w-8 h-12 text-muted-foreground mb-2" />
                                                )}
                                                <span className="text-sm text-muted-foreground">
                                                    {previewMobileUrl ? 'Click to replace' : 'Click to upload mobile image'}
                                                </span>
                                            </label>
                                        </div>

                                        {/* Remove mobile image button */}
                                        {previewMobileUrl && (
                                            <button
                                                type="button"
                                                onClick={removeMobileImage}
                                                className="mt-2 flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
                                            >
                                                <FaTimes size={10} /> Remove mobile image
                                            </button>
                                        )}
                                    </div>

                                    {/* Side-by-side preview */}
                                    {previewUrl && previewMobileUrl && (
                                        <div className="border-t pt-3">
                                            <p className="text-xs text-muted-foreground mb-2 font-medium">Preview comparison</p>
                                            <div className="flex gap-3 items-end">
                                                <div className="flex-1">
                                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                        <FaDesktop size={10} /> Desktop
                                                    </p>
                                                    <div className="relative w-full h-24 rounded overflow-hidden">
                                                        <Image src={previewUrl} alt="Desktop" fill className="object-cover" />
                                                    </div>
                                                </div>
                                                <div style={{ width: 56 }}>
                                                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                                        <FaMobileAlt size={10} /> Mobile
                                                    </p>
                                                    <div className="relative rounded overflow-hidden" style={{ width: 56, height: 96 }}>
                                                        <Image src={previewMobileUrl} alt="Mobile" fill className="object-cover" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Gradient */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Gradient Overlay</label>
                                    <select name="gradient" value={formData.gradient} onChange={handleInputChange}
                                        className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring">
                                        <option value="from-black/90 via-black/40 to-transparent">Black Fade</option>
                                        <option value="from-slate-900/90 via-slate-900/40 to-transparent">Slate Fade</option>
                                        <option value="from-primary/90 via-primary/40 to-transparent">Primary Fade</option>
                                        <option value="from-blue-900/90 via-blue-900/40 to-transparent">Blue Fade</option>
                                    </select>
                                </div>

                                {/* Active toggle */}
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange}
                                        id="isActive" className="w-4 h-4 text-primary rounded focus:ring-ring" />
                                    <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                                </div>

                                {/* Scheduling */}
                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3">Scheduling (Optional)</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Start Date</label>
                                            <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange}
                                                className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">End Date</label>
                                            <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange}
                                                className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring" />
                                        </div>
                                    </div>
                                </div>

                                {/* Order */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Display Order</label>
                                    <input type="number" name="order" value={formData.order} onChange={handleInputChange}
                                        className="w-full p-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring" />
                                    <p className="text-xs text-muted-foreground mt-1">Lower numbers show first</p>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={resetForm}
                                        className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={isSaving}
                                        className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <><FaSave /> Save Slide</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* ── SLIDES GRID ── */}
            {!isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slides.map((slide) => (
                        <Card key={slide._id} className="overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="relative h-48">
                                <Image
                                    src={slide.image?.startsWith('http') ? slide.image : `${API_URL.replace('/api', '')}${slide.image}`}
                                    alt={slide.title} fill className="object-cover" />
                                <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="font-bold text-lg truncate" style={{ color: slide.textColor || '#ffffff' }}>
                                        {slide.title}
                                    </h3>
                                    <p className="text-sm truncate" style={{ color: slide.textColor ? `${slide.textColor}99` : 'rgba(255,255,255,0.7)' }}>
                                        {slide.subtitle}
                                    </p>
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded"
                                        style={{
                                            background: slide.buttonStyle === 'filled' ? slide.buttonColor || '#fff' : 'transparent',
                                            color: slide.buttonStyle === 'filled' ? slide.buttonTextColor || '#000' : slide.buttonColor || '#fff',
                                            border: `1px solid ${slide.buttonColor || '#fff'}`,
                                        }}>
                                        {slide.primaryCTA?.text || 'Shop Now'}
                                    </span>
                                </div>
                                {/* Mobile image badge */}
                                {slide.imageMobile && (
                                    <div className="absolute top-2 left-2">
                                        <span className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                                            <FaMobileAlt size={9} /> Mobile img
                                        </span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(slide)}
                                        className="p-2 bg-card/90 text-card-foreground rounded-full hover:bg-card hover:text-primary transition-colors">
                                        <FaEdit size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(slide._id)}
                                        className="p-2 bg-card/90 text-card-foreground rounded-full hover:bg-card hover:text-destructive transition-colors">
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </div>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${slide.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                        {slide.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">Order: {slide.order}</span>
                                </div>
                                <div className="flex gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
                                    <span className="px-2 py-0.5 bg-muted rounded">{slide.templateType || 'center'}</span>
                                    <span className="px-2 py-0.5 bg-muted rounded">{slide.showOn || 'all'}</span>
                                    <span className="px-2 py-0.5 bg-muted rounded capitalize">{slide.buttonStyle || 'filled'} btn</span>
                                    {slide.imageMobile && (
                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 rounded flex items-center gap-1">
                                            <FaMobileAlt size={9} /> custom img
                                        </span>
                                    )}
                                </div>
                                {(slide.startDate || slide.endDate) && (
                                    <div className="text-xs text-muted-foreground mb-2">
                                        {slide.startDate && <span>From: {new Date(slide.startDate).toLocaleDateString()}</span>}
                                        {slide.endDate && <span> • Until: {new Date(slide.endDate).toLocaleDateString()}</span>}
                                    </div>
                                )}
                                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                    <span>Views: {slide.views || 0}</span>
                                    <span>Clicks: {slide.clicks || 0}</span>
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