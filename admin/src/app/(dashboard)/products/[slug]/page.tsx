import { Metadata } from "next";
import { notFound } from "next/navigation";

import { fetchProductDetails } from "@/services/products";
import ProductDetailsClient from "./_components/ProductDetailsClient";

type PageParams = {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { product } = await fetchProductDetails({ slug });
    return { title: product.name };
  } catch {
    return { title: "Product not found" };
  }
}

export default async function ProductDetails({ params }: PageParams) {
  const { slug } = await params;
  console.log('🔍 SSR: Fetching product details for slug:', slug);
  let product;
  try {
    const response = await fetchProductDetails({ slug });
    product = response.product;
    console.log('✅ SSR: Product details fetched successfully');
    console.log('✅ SSR: Product data:', product.name);
  } catch (error: unknown) {
    console.error('❌ SSR: Error fetching product details:', error);
    return notFound();
  }

  return <ProductDetailsClient product={product} />;
}