"use client";

import { useState, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Edit3, Package, FileText, Layers, Search,
  Tag, BarChart3, AlertCircle, CheckCircle2, DollarSign,
  Archive, Download
} from "lucide-react";
import { EditProductSheet } from "./EditProductSheet";
import { ProductDetails, ProductVariant } from "@/types/api";
import { getStockStatus, getStockDisplayText } from "@/utils/stockStatus";

type ProductDetailsClientProps = {
  product: ProductDetails;
};

const ProductImageGallery = memo(({ product, displayImages, displayName }: { product: ProductDetails | ProductVariant; displayImages: string[]; displayName: string }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const images = displayImages.length > 0 ? displayImages : ('image_url' in product ? product.image_url : (product as ProductVariant).images) || [];

  return (
    <div className="w-full">
      {images.length > 0 ? (
        <div className="space-y-3">
          <div className="aspect-square w-full bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2e2e2e] overflow-hidden">
            <Image
              src={images[selectedImageIndex]}
              alt={`${displayName || 'Product'} - Main`}
              width={400}
              height={400}
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              priority={selectedImageIndex === 0}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((image: string, index: number) => (
                <button
                  key={index}
                  className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${selectedImageIndex === index
                    ? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-900'
                    : 'border-gray-200 dark:border-[#2e2e2e] hover:border-gray-300 dark:hover:border-[#3a3a3a]'
                    }`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square w-full bg-gray-100 dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2e2e2e] flex items-center justify-center">
          <Package className="w-16 h-16 text-gray-300 dark:text-[#444]" />
        </div>
      )}
    </div>
  );
});

ProductImageGallery.displayName = "ProductImageGallery";

export default function ProductDetailsClient({ product }: ProductDetailsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const variantSlug = searchParams.get('variant');

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 dark:text-[#444] mx-auto mb-4" />
          <p className="text-gray-500 dark:text-[#888]">Product not found</p>
        </div>
      </div>
    );
  }

  const selectedVariant = variantSlug && product.product_variants
    ? product.product_variants.find((v: ProductVariant) => v.slug === variantSlug)
    : null;

  const defaultVariant = !selectedVariant && product.product_structure === 'variant' && product.product_variants && product.product_variants.length > 0
    ? product.product_variants[0]
    : null;

  const currentProduct = selectedVariant || defaultVariant || product;
  const safeCurrentProduct = currentProduct || product || {};

  const getProductImages = (p: ProductDetails | ProductVariant) => {
    if ('image_url' in p && Array.isArray(p.image_url)) return p.image_url;
    if ('images' in p && Array.isArray(p.images)) return p.images;
    return [];
  };

  const currentProductImages = getProductImages(safeCurrentProduct as ProductDetails | ProductVariant);
  const displayImages = currentProductImages.length > 0
    ? currentProductImages
    : getProductImages(product);

  const displayName = safeCurrentProduct.name || product?.name || 'Unnamed Product';

  const currentStock = selectedVariant
    ? (selectedVariant.stock !== undefined ? selectedVariant.stock : (product?.baseStock || 0))
    : (product?.baseStock || 0);

  const currentMinStock = selectedVariant
    ? (selectedVariant.minStock !== undefined ? selectedVariant.minStock : (product?.minStock || 0))
    : (product?.minStock || 0);

  const stockStatusInfo = getStockStatus(currentStock, product?.published, false);
  const stockPercentage = currentStock && currentMinStock
    ? Math.min((currentStock / (currentMinStock * 2)) * 100, 100)
    : 0;

  const profitMargin = (safeCurrentProduct as ProductDetails).cost_price && (safeCurrentProduct as ProductDetails).selling_price
    ? ((((safeCurrentProduct as ProductDetails).selling_price - (safeCurrentProduct as ProductDetails).cost_price) / (safeCurrentProduct as ProductDetails).selling_price) * 100).toFixed(1)
    : "0";

  const handleBack = () => router.push('/products');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      {/* Header */}
      <div className="bg-white dark:bg-[#0f0f0f] border-b border-gray-200 dark:border-[#2e2e2e]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-gray-600 dark:text-[#aaa] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#252525]"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-4 w-px bg-gray-300 dark:bg-[#2e2e2e]" />
              <span className="text-sm text-gray-500 dark:text-[#888]">Product Details</span>
            </div>
            <EditProductSheet product={product}>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Edit3 className="w-4 h-4" />
                Edit Product
              </Button>
            </EditProductSheet>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Product Header */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-gray-200 dark:border-[#2e2e2e] p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                <Link
                  href={`/products/${product.slug}`}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  {currentProduct === product ? product.name : `${product.name} > ${currentProduct.slug || currentProduct.name}`}
                </Link>
              </h1>
              <div className="flex items-center gap-2">
                <Badge
                  variant={stockStatusInfo.visibility === 'visible' ? "default" : "secondary"}
                  className={`border ${stockStatusInfo.color === 'green'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-900'
                    : stockStatusInfo.color === 'yellow'
                      ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900'
                      : 'bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-[#aaa] border-gray-200 dark:border-[#3a3a3a]'
                    }`}
                >
                  {stockStatusInfo.status === 'published' ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" />{stockStatusInfo.label}</>
                  ) : (
                    <><AlertCircle className="w-3 h-3 mr-1" />{stockStatusInfo.label}</>
                  )}
                </Badge>
                <Badge variant="outline" className="bg-white dark:bg-[#252525] dark:text-[#ccc] dark:border-[#3a3a3a]">
                  {product.product_type || "Physical"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image */}
          <div className="lg:col-span-1">
            <ProductImageGallery product={safeCurrentProduct} displayImages={displayImages} displayName={displayName} />
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2e2e2e] p-1">
                <TabsTrigger value="overview" className="gap-2 dark:text-[#aaa] data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400">
                  <BarChart3 className="w-4 h-4" /> Overview
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-2 dark:text-[#aaa] data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400">
                  <FileText className="w-4 h-4" /> Details
                </TabsTrigger>
                <TabsTrigger value="variants" className="gap-2 dark:text-[#aaa] data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400">
                  <Layers className="w-4 h-4" /> Variants
                </TabsTrigger>
                <TabsTrigger value="seo" className="gap-2 dark:text-[#aaa] data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400">
                  <Search className="w-4 h-4" /> SEO
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pricing Card */}
                  <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium flex items-center gap-2 text-gray-700 dark:text-[#ccc]">
                        <DollarSign className="w-4 h-4" /> Pricing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-600 dark:text-[#888]">Selling Price</span>
                        <span className="text-xl font-semibold text-gray-900 dark:text-white">₹{safeCurrentProduct.selling_price?.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-gray-600 dark:text-[#888]">Cost Price</span>
                        <span className="text-base text-gray-700 dark:text-[#ccc]">₹{safeCurrentProduct.cost_price?.toLocaleString('en-IN')}</span>
                      </div>
                      <Separator className="dark:bg-[#2e2e2e]" />
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-medium text-gray-700 dark:text-[#ccc]">Profit Margin</span>
                        <span className={`text-base font-semibold ${parseFloat(profitMargin) > 20 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {profitMargin}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Inventory Card */}
                  {product.product_type !== 'digital' && (
                    <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2 text-gray-700 dark:text-[#ccc]">
                          <Archive className="w-4 h-4" /> Inventory
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-gray-600 dark:text-[#888]">Current Stock</span>
                          <span className="text-xl font-semibold text-gray-900 dark:text-white">{getStockDisplayText(currentStock)}</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-gray-600 dark:text-[#888]">Min. Threshold</span>
                          <span className="text-base text-gray-700 dark:text-[#ccc]">{currentMinStock || 0}</span>
                        </div>
                        <Separator className="dark:bg-[#2e2e2e]" />
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-[#888]">Status</span>
                            <span className={`font-medium ${stockStatusInfo.color === 'green' ? 'text-green-600 dark:text-green-400' :
                              stockStatusInfo.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-gray-600 dark:text-[#888]'
                              }`}>
                              {stockStatusInfo.label}
                            </span>
                          </div>
                          <div className={`h-2 rounded-full ${stockStatusInfo.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                            stockStatusInfo.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                              'bg-gray-100 dark:bg-[#252525]'
                            }`}>
                            <div
                              className={`h-full rounded-full transition-all ${stockStatusInfo.color === 'green' ? 'bg-green-600 dark:bg-green-500' :
                                stockStatusInfo.color === 'yellow' ? 'bg-yellow-600 dark:bg-yellow-500' :
                                  'bg-gray-400 dark:bg-[#555]'
                                }`}
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Digital Product Card */}
                  {product.product_type === 'digital' && (
                    <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2 text-gray-700 dark:text-[#ccc]">
                          <FileText className="w-4 h-4" /> Digital Product
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-gray-600 dark:text-[#888]">File Type</span>
                          <span className="text-base font-semibold text-gray-900 dark:text-white uppercase">
                            {product.download_format || 'N/A'}
                          </span>
                        </div>
                        {product.file_size && (
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-gray-600 dark:text-[#888]">File Size</span>
                            <span className="text-base text-gray-700 dark:text-[#ccc]">
                              {(product.file_size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        )}
                        {product.license_type && (
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-gray-600 dark:text-[#888]">License</span>
                            <span className="text-base text-gray-700 dark:text-[#ccc] capitalize">
                              {product.license_type}
                            </span>
                          </div>
                        )}
                        {product.download_limit && (
                          <div className="flex justify-between items-baseline">
                            <span className="text-sm text-gray-600 dark:text-[#888]">Download Limit</span>
                            <span className="text-base text-gray-700 dark:text-[#ccc]">
                              {product.download_limit} downloads
                            </span>
                          </div>
                        )}
                        {product.file_path && (
                          <div className="pt-4 border-t border-gray-200 dark:border-[#2e2e2e]">
                            <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                              <Download className="w-4 h-4" /> Download Digital File
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Description */}
                <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-gray-700 dark:text-[#ccc]">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-[#888] leading-relaxed">
                      {product.description || "No description available"}
                    </p>
                  </CardContent>
                </Card>

                {/* Categories & Tags */}
                <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                  <CardHeader>
                    <CardTitle className="text-base font-medium flex items-center gap-2 text-gray-700 dark:text-[#ccc]">
                      <Tag className="w-4 h-4" /> Categories & Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-[#ccc] mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {product.categories && product.categories.length > 0 ? (
                          product.categories.map((cat, idx) => (
                            <Badge key={idx} variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900">
                              {cat.category.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-[#555]">No categories</span>
                        )}
                      </div>
                    </div>
                    {product.categories && product.categories.some(cat => cat.subcategories?.length > 0) && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-[#ccc] mb-2">Subcategories</p>
                        <div className="flex flex-wrap gap-2">
                          {product.categories.flatMap(cat => cat.subcategories || []).map((sub, idx) => (
                            <Badge key={idx} variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900">
                              {sub.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {product.tags && product.tags.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-[#ccc] mb-2">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="bg-gray-50 dark:bg-[#252525] text-gray-700 dark:text-[#aaa] border-gray-200 dark:border-[#3a3a3a]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                  <CardHeader>
                    <CardTitle className="text-base font-medium text-gray-700 dark:text-[#ccc]">Product Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-[#888]">SKU</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-[#252525] px-2 py-1 rounded inline-block">
                          {safeCurrentProduct.sku || 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-[#888]">Product Type</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{product.product_type || "Physical"}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-[#888]">Created</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {new Date(product.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-[#888]">Last Updated</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {new Date(product.updated_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {product.product_type !== 'digital' && (
                  <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                    <CardHeader>
                      <CardTitle className="text-base font-medium text-gray-700 dark:text-[#ccc]">Inventory Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600 dark:text-[#888]">Current Stock</dt>
                          <dd className="text-sm font-semibold text-gray-900 dark:text-white">{getStockDisplayText(currentStock)} units</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600 dark:text-[#888]">Minimum Stock</dt>
                          <dd className="text-sm font-semibold text-gray-900 dark:text-white">{currentMinStock || 0} units</dd>
                        </div>
                        <Separator className="dark:bg-[#2e2e2e]" />
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600 dark:text-[#888]">Stock Health</span>
                            <span className={`text-sm font-medium ${stockStatusInfo.color === 'green' ? 'text-green-600 dark:text-green-400' :
                              stockStatusInfo.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-gray-600 dark:text-[#888]'
                              }`}>
                              {stockStatusInfo.label}
                            </span>
                          </div>
                          <div className={`h-2.5 rounded-full ${stockStatusInfo.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                            stockStatusInfo.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                              'bg-gray-100 dark:bg-[#252525]'
                            }`}>
                            <div
                              className={`h-full rounded-full transition-all ${stockStatusInfo.color === 'green' ? 'bg-green-600 dark:bg-green-500' :
                                stockStatusInfo.color === 'yellow' ? 'bg-yellow-600 dark:bg-yellow-500' :
                                  'bg-gray-400 dark:bg-[#555]'
                                }`}
                              style={{ width: `${stockPercentage}%` }}
                            />
                          </div>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                )}

                {product.product_type === 'digital' && (
                  <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                    <CardHeader>
                      <CardTitle className="text-base font-medium text-gray-700 dark:text-[#ccc]">Digital Product Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600 dark:text-[#888]">File Path</dt>
                          <dd className="text-sm font-mono text-gray-900 dark:text-white bg-gray-50 dark:bg-[#252525] px-2 py-1 rounded">
                            {product.file_path ? product.file_path.split('/').pop() : 'No file uploaded'}
                          </dd>
                        </div>
                        {product.file_size && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600 dark:text-[#888]">File Size</dt>
                            <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                              {(product.file_size / (1024 * 1024)).toFixed(2)} MB
                            </dd>
                          </div>
                        )}
                        {product.download_format && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600 dark:text-[#888]">Format</dt>
                            <dd className="text-sm font-semibold text-gray-900 dark:text-white uppercase">
                              {product.download_format}
                            </dd>
                          </div>
                        )}
                        {product.license_type && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600 dark:text-[#888]">License Type</dt>
                            <dd className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                              {product.license_type}
                            </dd>
                          </div>
                        )}
                        {product.download_limit && (
                          <div className="flex justify-between">
                            <dt className="text-sm text-gray-600 dark:text-[#888]">Download Limit</dt>
                            <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                              {product.download_limit} downloads
                            </dd>
                          </div>
                        )}
                        {product.file_path && (
                          <div className="pt-4 border-t border-gray-200 dark:border-[#2e2e2e]">
                            <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                              <Download className="w-4 h-4" /> Download Digital File
                            </Button>
                          </div>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Variants Tab */}
              <TabsContent value="variants" className="space-y-4">
                {product.product_type === 'digital' ? (
                  <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-300 dark:text-[#444] mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-[#888]">Digital products don&apos;t have variants</p>
                        <p className="text-xs text-gray-400 dark:text-[#555] mt-1">Variants are only available for physical products</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : product.product_variants && Array.isArray(product.product_variants) && product.product_variants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.product_variants.map((variant: ProductVariant, idx: number) => (
                      <Card key={idx} className={`border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a] ${selectedVariant && selectedVariant.slug === variant.slug ? 'ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <Link
                                href={`/products/${product.slug}?variant=${variant.slug}`}
                                className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {variant.slug}
                              </Link>
                              <div className="flex items-center gap-2">
                                {selectedVariant && selectedVariant.slug === variant.slug && (
                                  <Badge variant="default" className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">Selected</Badge>
                                )}
                                <Badge variant="outline" className="text-xs dark:border-[#3a3a3a] dark:text-[#aaa]">Variant</Badge>
                              </div>
                            </div>
                            <dl className="space-y-2 text-sm">
                              {variant.sku && (
                                <div className="flex justify-between">
                                  <dt className="text-gray-600 dark:text-[#888]">SKU</dt>
                                  <dd className="font-mono text-gray-900 dark:text-white">{variant.sku}</dd>
                                </div>
                              )}
                              {variant.cost_price && (
                                <div className="flex justify-between">
                                  <dt className="text-gray-600 dark:text-[#888]">Cost Price</dt>
                                  <dd className="font-semibold text-gray-900 dark:text-white">₹{variant.cost_price.toLocaleString('en-IN')}</dd>
                                </div>
                              )}
                              {variant.selling_price && (
                                <div className="flex justify-between">
                                  <dt className="text-gray-600 dark:text-[#888]">Selling Price</dt>
                                  <dd className="font-semibold text-green-600 dark:text-green-400">₹{variant.selling_price.toLocaleString('en-IN')}</dd>
                                </div>
                              )}
                              {variant.stock !== undefined && (
                                <div className="flex justify-between">
                                  <dt className="text-gray-600 dark:text-[#888]">Stock</dt>
                                  <dd className="font-semibold text-gray-900 dark:text-white">{getStockDisplayText(variant.stock)} units</dd>
                                </div>
                              )}
                              {variant.minStock !== undefined && (
                                <div className="flex justify-between">
                                  <dt className="text-gray-600 dark:text-[#888]">Min. Stock</dt>
                                  <dd className="font-semibold text-gray-900 dark:text-white">{variant.minStock} units</dd>
                                </div>
                              )}
                              {variant.images && variant.images.length > 0 && (
                                <div>
                                  <dt className="text-gray-600 dark:text-[#888] mb-2 block">Images</dt>
                                  <dd>
                                    <div className="flex gap-2 overflow-x-auto">
                                      {variant.images.slice(0, 5).map((image: string, imgIdx: number) => (
                                        <div key={imgIdx} className="w-12 h-12 rounded border border-gray-200 dark:border-[#2e2e2e] overflow-hidden flex-shrink-0">
                                          <Image src={image} alt={`Variant image ${imgIdx + 1}`} width={48} height={48} className="w-full h-full object-cover" />
                                        </div>
                                      ))}
                                      {variant.images.length > 5 && (
                                        <div className="w-12 h-12 rounded border border-gray-200 dark:border-[#2e2e2e] bg-gray-50 dark:bg-[#252525] flex items-center justify-center text-xs text-gray-500 dark:text-[#888]">
                                          +{variant.images.length - 5}
                                        </div>
                                      )}
                                    </div>
                                  </dd>
                                </div>
                              )}
                              {variant.published !== undefined && (
                                <div className="flex justify-between">
                                  <dt className="text-gray-600 dark:text-[#888]">Published</dt>
                                  <dd>
                                    <Badge variant={variant.published ? "default" : "secondary"} className="text-xs dark:border-[#3a3a3a]">
                                      {variant.published ? "Published" : "Draft"}
                                    </Badge>
                                  </dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Layers className="w-12 h-12 text-gray-300 dark:text-[#444] mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-[#888]">No variants available</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-4">
                {product.seo && (product.seo.title || product.seo.description || (product.seo.keywords && product.seo.keywords.length > 0)) ? (
                  <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                    <CardHeader>
                      <CardTitle className="text-base font-medium text-gray-700 dark:text-[#ccc]">SEO Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {product.seo.title && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-[#ccc] mb-1.5 block">Meta Title</label>
                          <div className="bg-gray-50 dark:bg-[#252525] p-3 rounded border border-gray-200 dark:border-[#3a3a3a]">
                            <p className="text-sm text-gray-900 dark:text-white">{product.seo.title}</p>
                          </div>
                        </div>
                      )}
                      {product.seo.description && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-[#ccc] mb-1.5 block">Meta Description</label>
                          <div className="bg-gray-50 dark:bg-[#252525] p-3 rounded border border-gray-200 dark:border-[#3a3a3a]">
                            <p className="text-sm text-gray-900 dark:text-white">{product.seo.description}</p>
                          </div>
                        </div>
                      )}
                      {product.seo.keywords && product.seo.keywords.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-[#ccc] mb-2 block">Keywords</label>
                          <div className="flex flex-wrap gap-2">
                            {product.seo.keywords.map((keyword: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-gray-200 dark:border-[#2e2e2e] dark:bg-[#1a1a1a]">
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Search className="w-12 h-12 text-gray-300 dark:text-[#444] mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-[#888]">No SEO configuration</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}