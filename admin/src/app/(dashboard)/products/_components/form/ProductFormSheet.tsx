"use client";

import { useRef, LegacyRef, useState, useTransition, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldErrors } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";

import {
  FormSheetContent,
  FormSheetBody,
  FormSheetHeader,
  FormSheetFooter,
} from "@/components/shared/form/FormSheet";
import {
  FormTextInput,
  FormMultipleCategorySubcategoryInput,
  FormMultipleImageInput,
  FormPriceInput,
  FormSlugInput,
  FormTextarea,
  FormTagsInput,
  FormProductTypeSelect,
  FormVariantManagement,
  FormProductStructureSelect,
} from "@/components/shared/form";
import { FormSubmitButton } from "@/components/shared/form/FormSubmitButton";
import { productFormSchema, ProductFormData } from "./schema";
import { objectToFormData } from "@/helpers/objectToFormData";
import { ProductServerActionResponse } from "@/types/server-action";
import { VariantManager } from "@/types/variants";
import { getStockStatus } from "@/utils/stockStatus";

type ProductFormProps = {
  title: string;
  description: string;
  submitButtonText: string;
  actionVerb: string;
  children: React.ReactNode;
  action: (formData: FormData) => Promise<ProductServerActionResponse>;
  initialData?: Partial<ProductFormData>;
  previewImage?: string;
  previewImages?: string[];
};

export default function ProductFormSheet({
  title,
  description,
  submitButtonText,
  actionVerb,
  initialData,
  previewImage,
  previewImages,
  children,
  action,
}: ProductFormProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [container, setContainer] = useState(null);
  const imageDropzoneRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLButtonElement>(null);

  const displayPreviewImages =
    previewImages || (previewImage ? [previewImage] : []);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productType: "physical",
      productStructure: "simple",
      name: "",
      description: "",
      images: [],
      sku: "",
      categories: [],
      costPrice: undefined,
      salesPrice: undefined,
      taxPercentage: 0,
      stock: undefined,
      minStockThreshold: undefined,
      status: "selling",
      weight: undefined,
      color: "",
      size: "",
      material: "",
      brand: "",
      warranty: "",
      fileUpload: undefined,
      fileSize: undefined,
      downloadFormat: "",
      licenseType: "",
      downloadLimit: undefined,
      tags: [],
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
      seoCanonical: "",
      seoRobots: "index,follow",
      seoOgTitle: "",
      seoOgDescription: "",
      seoOgImage: "",
      slug: "",
      product_variants: {
        attributes: [
          { id: "attr-size", name: "size", values: [] },
          { id: "attr-color", name: "color", values: [] },
          { id: "attr-material", name: "material", values: [] },
        ],
        combinations: [],
        autoGenerateSKU: true,
      },
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        productType: "physical",
        productStructure: "simple",
        name: "",
        description: "",
        images: [],
        sku: "",
        categories: [],
        costPrice: undefined,
        salesPrice: undefined,
        taxPercentage: 0,
        stock: undefined,
        minStockThreshold: undefined,
        status: "selling",
        weight: undefined,
        color: "",
        size: "",
        material: "",
        brand: "",
        warranty: "",
        fileUpload: undefined,
        fileSize: undefined,
        downloadFormat: "",
        licenseType: "",
        downloadLimit: undefined,
        tags: [],
        seoTitle: "",
        seoDescription: "",
        seoKeywords: [],
        seoCanonical: "",
        seoRobots: "index,follow",
        seoOgTitle: "",
        seoOgDescription: "",
        seoOgImage: "",
        slug: "",
        product_variants: {
          attributes: [
            { id: "attr-size", name: "size", values: [] },
            { id: "attr-color", name: "color", values: [] },
            { id: "attr-material", name: "material", values: [] },
          ],
          combinations: [],
          autoGenerateSKU: true,
        },
        ...initialData,
      });
    }
  }, [initialData, form]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);
      const roundedSize = Math.round(fileSizeMB * 10000) / 10000;
      const fileExtension = file.name.split(".").pop()?.toUpperCase() || "";
      const numericFileSize = Number(roundedSize.toFixed(4));
      form.setValue("fileSize", numericFileSize, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      form.setValue("downloadFormat", fileExtension || "PDF", {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      form.trigger(["fileSize", "downloadFormat"]);
    }
  };

  const productStructure = form.watch("productStructure");

  useEffect(() => {
    if (productStructure === "simple") {
      form.setValue("status", "selling", {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
    } else if (productStructure === "variant") {
      form.setValue("status", "draft", {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
      form.setValue("costPrice", undefined, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
      form.setValue("salesPrice", undefined, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
      form.setValue("stock", undefined, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
      form.setValue("minStockThreshold", undefined, {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
      setTimeout(() => {
        form.trigger([
          "costPrice",
          "salesPrice",
          "stock",
          "minStockThreshold",
        ]);
      }, 0);
    }
  }, [productStructure, form]);

  const productType = form.watch("productType");

  useEffect(() => {
    if (productType === "digital") {
      form.setValue("productStructure", "simple", {
        shouldValidate: false,
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [productType, form]);

  const slug = form.watch("slug");

  // ✅ FIX 2: Canonical URL — update the value but keep the field visible.
  // The field is readOnly (auto-generated) but its value must stay rendered.
  // Previously the field appeared "hidden" because the value was set after
  // render and React-Hook-Form's controlled input wasn't picking it up.
  // Using form.setValue with shouldValidate: true forces the displayed value
  // to refresh in the controlled input.
  useEffect(() => {
    if (slug) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const canonical = `${baseUrl}/products/${slug}`;
      form.setValue("seoCanonical", canonical, {
        shouldValidate: true,   // ← was false; triggers re-render so value shows
        shouldDirty: true,      // ← was false; marks field dirty so it's included in submit
        shouldTouch: false,
      });
    }
  }, [slug, form]);

  const images = form.watch("images");
  const variants = form.watch("product_variants");
  const currentOgImage = form.watch("seoOgImage");

  useEffect(() => {
    const productStructure = form.watch("productStructure");
    if (
      productStructure === "variant" &&
      variants?.combinations &&
      variants.combinations.length > 0
    ) {
      for (const variant of variants.combinations) {
        if (variant.images && variant.images.length > 0) {
          const firstVariantImage = variant.images[0];
          if (typeof firstVariantImage === "string") {
            if (firstVariantImage.startsWith("http")) {
              form.setValue("seoOgImage", firstVariantImage, {
                shouldValidate: false,
                shouldDirty: false,
                shouldTouch: false,
              });
            } else {
              const baseUrl =
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
              form.setValue(
                "seoOgImage",
                `${baseUrl}${firstVariantImage}`,
                { shouldValidate: false, shouldDirty: false, shouldTouch: false }
              );
            }
            return;
          }
        }
      }
    }
    if (images && images.length > 0) {
      const firstImage = images[0];
      if (typeof firstImage === "string") {
        if (firstImage.startsWith("http")) {
          form.setValue("seoOgImage", firstImage, {
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false,
          });
        } else {
          const baseUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
          form.setValue("seoOgImage", `${baseUrl}${firstImage}`, {
            shouldValidate: false,
            shouldDirty: false,
            shouldTouch: false,
          });
        }
      }
    }
  }, [images, variants, form]);

  const getOgImagePreview = () => {
    if (currentOgImage) {
      if (
        typeof currentOgImage === "string" &&
        currentOgImage.startsWith("http")
      )
        return currentOgImage;
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5000";
      return `${baseUrl}${currentOgImage}`;
    }
    const productStructure = form.watch("productStructure");
    if (
      productStructure === "variant" &&
      variants?.combinations &&
      variants.combinations.length > 0
    ) {
      for (const variant of variants.combinations) {
        if (variant.images && variant.images.length > 0) {
          const firstVariantImage = variant.images[0];
          if (typeof firstVariantImage === "string") {
            if (firstVariantImage.startsWith("http")) return firstVariantImage;
            const baseUrl =
              process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5000";
            return `${baseUrl}${firstVariantImage}`;
          }
          return `Variant has ${variant.images.length} image(s) - first will be used for social sharing`;
        }
      }
    }
    if (images && images.length > 0) {
      const firstImage = images[0];
      if (typeof firstImage === "string") {
        if (firstImage.startsWith("http")) return firstImage;
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5000";
        return `${baseUrl}${firstImage}`;
      }
      return `${images.length} image(s) uploaded - first will be used for social sharing`;
    }
    return "No images uploaded yet";
  };

  const fileSize = form.watch("fileSize");
  const downloadFormat = form.watch("downloadFormat");

  useEffect(() => {
    console.log("Form field values:", { fileSize, downloadFormat });
  }, [fileSize, downloadFormat]);

  const onSubmit = (data: ProductFormData) => {
    const currentFormData = form.getValues();
    const finalData = { ...data, ...currentFormData };

    if (
      finalData.productType === "digital" &&
      (!finalData.productStructure ||
        finalData.productStructure !== "simple")
    ) {
      finalData.productStructure = "simple";
    }

    if (finalData.productType === "digital") {
      const currentFileSize = form.getValues("fileSize");
      const currentDownloadFormat = form.getValues("downloadFormat");
      const currentLicenseType = form.getValues("licenseType");
      const currentDownloadLimit = form.getValues("downloadLimit");
      if (currentFileSize !== undefined && currentFileSize !== "")
        finalData.fileSize = currentFileSize;
      if (currentDownloadFormat && currentDownloadFormat !== "")
        finalData.downloadFormat = currentDownloadFormat;
      if (currentLicenseType && currentLicenseType !== "")
        finalData.licenseType = currentLicenseType;
      if (currentDownloadLimit !== undefined && currentDownloadLimit !== "")
        finalData.downloadLimit = currentDownloadLimit;
    }

    if (finalData.productStructure === "variant") {
      delete finalData.costPrice;
      delete finalData.salesPrice;
      delete finalData.stock;
      delete finalData.minStockThreshold;
    }

    const currentSlug = form.getValues("slug");
    const currentStock =
      finalData.productStructure === "variant"
        ? undefined
        : form.getValues("stock");
    const currentMinStock =
      finalData.productStructure === "variant"
        ? undefined
        : form.getValues("minStockThreshold");
    const currentVariants = form.getValues("product_variants");

    if (currentSlug) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "https://yourstore.com";
      form.setValue(
        "seoCanonical",
        `${baseUrl}/products/${currentSlug}`,
        { shouldValidate: false, shouldDirty: false, shouldTouch: false }
      );
    }

    const isBaseInStock = (currentStock || 0) > (currentMinStock || 0);
    const hasVariantsInStock =
      currentVariants?.combinations?.some(
        (variant: any) =>
          variant.stock !== undefined &&
          variant.minStock !== undefined &&
          variant.stock > variant.minStock
      ) || false;
    const isInStock = isBaseInStock || hasVariantsInStock;

    let robotsValue:
      | "index,follow"
      | "noindex,nofollow"
      | "index,nofollow"
      | "noindex,follow" = "noindex,nofollow";
    if (isInStock) robotsValue = "index,follow";
    else robotsValue = "noindex,follow";
    form.setValue("seoRobots", robotsValue, {
      shouldValidate: false,
      shouldDirty: false,
      shouldTouch: false,
    });

    const product_variants = form.getValues("product_variants");
    const {
      images: formImages,
      product_variants: _unused,
      ...dataWithoutFiles
    } = finalData;
    const formData = objectToFormData(dataWithoutFiles);

    formData.append("tax_percentage", String(finalData.taxPercentage ?? 0));

    const newImageFiles: File[] = [];
    const existingImageUrls: string[] = [];

    if (formImages && formImages.length > 0) {
      formImages.forEach((img: any) => {
        if (img instanceof File) newImageFiles.push(img);
        else if (typeof img === "string") existingImageUrls.push(img);
      });
    }

    if (existingImageUrls.length === 0 && displayPreviewImages.length > 0) {
      existingImageUrls.push(...displayPreviewImages);
    }

    newImageFiles.forEach((file, index) => {
      formData.append(`images[${index}]`, file);
    });

    if (existingImageUrls.length > 0) {
      formData.append("image_url", JSON.stringify(existingImageUrls));
    }

    if (product_variants) {
      const variantsForJson = {
        ...product_variants,
        combinations:
          product_variants.combinations?.map((combo: any) => {
            const { images: comboImages, ...comboWithoutImages } = combo;
            return comboWithoutImages;
          }) || [],
      };
      formData.append("product_variants", JSON.stringify(variantsForJson));

      product_variants.combinations?.forEach(
        (combo: any, comboIdx: number) => {
          let newFileIdx = 0;
          let existingUrlIdx = 0;
          const comboImages = combo.images || [];
          comboImages.forEach((img: any) => {
            if (img instanceof File) {
              formData.append(`variantImages[${comboIdx}][${newFileIdx}]`, img);
              newFileIdx++;
            } else if (typeof img === "string" && img.length > 0) {
              formData.append(
                `existingVariantImages[${comboIdx}][${existingUrlIdx}]`,
                img
              );
              existingUrlIdx++;
            }
          });
        }
      );
    }

    setTimeout(() => {
      startTransition(async () => {
        try {
          const result = await action(formData);

          if (!result) {
            toast.error("No response received from server");
            return;
          }

          if ("validationErrors" in result) {
            Object.keys(result.validationErrors).forEach((key) => {
              form.setError(key as keyof ProductFormData, {
                message: result.validationErrors![key],
              });
            });
            form.setFocus(
              Object.keys(
                result.validationErrors
              )[0] as keyof ProductFormData
            );
          } else if ("product" in result) {
            form.reset({
              productType: "physical",
              productStructure: "simple",
              name: "",
              description: "",
              images: [],
              sku: "",
              categories: [],
              costPrice: undefined,
              salesPrice: undefined,
              taxPercentage: 0,
              stock: undefined,
              minStockThreshold: undefined,
              status: "selling",
              weight: undefined,
              color: "",
              size: "",
              material: "",
              brand: "",
              warranty: "",
              fileUpload: undefined,
              fileSize: undefined,
              downloadFormat: "",
              seoTitle: "",
              seoDescription: "",
              seoKeywords: [],
              seoCanonical: "",
              seoRobots: "index,follow",
              seoOgTitle: "",
              seoOgDescription: "",
              seoOgImage: "",
              slug: "",
              product_variants: {
                attributes: [
                  { id: "attr-size", name: "size", values: [] },
                  { id: "attr-color", name: "color", values: [] },
                  { id: "attr-material", name: "material", values: [] },
                ],
                combinations: [],
                autoGenerateSKU: true,
              },
            });
            toast.success(
              `Product "${result.product.name}" ${actionVerb} successfully!`,
              { position: "top-center" }
            );
            queryClient.invalidateQueries({ queryKey: ["products"] });
            setIsSheetOpen(false);
          } else {
            toast.error("Unexpected response from server");
          }
        } catch (error) {
          console.error("=== ACTION ERROR ===", error);
          toast.error("An error occurred while saving the product");
        }
      });
    }, 100);
  };

  const onInvalid = (errors: FieldErrors<ProductFormData>) => {
    console.log("=== FORM VALIDATION FAILED ===");
    console.log("Validation errors:", errors);
    if (errors.images) {
      imageDropzoneRef.current?.focus();
    } else if (errors.categories) {
      categoryRef.current?.focus();
    }
    const firstErrorKey = Object.keys(errors)[0];
    const firstError = errors[firstErrorKey as keyof ProductFormData];
    if (firstError && "message" in firstError) {
      toast.error(`Validation error: ${firstError.message}`);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      {children}

      <SheetContent className="w-[90%] max-w-5xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="size-full"
          >
            <FormSheetContent>
              <FormSheetHeader>
                <div className="flex flex-col">
                  <SheetTitle>{title}</SheetTitle>
                  <SheetDescription>{description}</SheetDescription>
                </div>
              </FormSheetHeader>

              <FormSheetBody>
                <div
                  className="space-y-6"
                  ref={setContainer as LegacyRef<HTMLDivElement>}
                >
                  <FormTextInput
                    control={form.control}
                    name="name"
                    label="Product Name"
                    placeholder="Product Name / Title"
                  />

                  <FormProductTypeSelect
                    control={form.control}
                    name="productType"
                    label="Product Type"
                    placeholder="Select product type"
                  />

                  {form.watch("productType") === "physical" && (
                    <FormProductStructureSelect
                      control={form.control}
                      name="productStructure"
                      label="Product Structure"
                      placeholder="Select product structure"
                    />
                  )}

                  <FormSlugInput
                    form={form}
                    control={form.control}
                    name="slug"
                    label="Product Slug"
                    placeholder="Product Slug"
                    generateSlugFrom="name"
                  />

                  <FormTextarea
                    control={form.control}
                    name="description"
                    label="Product Description"
                    placeholder="Product Description"
                  />

                  {form.watch("productStructure") === "simple" && (
                    <FormMultipleImageInput
                      control={form.control}
                      name="images"
                      label="Product Images"
                      previewImages={displayPreviewImages}
                    />
                  )}

                  <FormTextInput
                    control={form.control}
                    name="sku"
                    label="Product SKU"
                    placeholder="Enter base SKU (e.g., TSHIRT)"
                    transform="uppercase"
                  />

                  <FormMultipleCategorySubcategoryInput
                    control={form.control}
                    name="categories"
                    label="Product Categories"
                    setValue={form.setValue}
                    watch={form.watch}
                  />

                  <FormTagsInput
                    control={form.control}
                    name="tags"
                    label="Product Tags"
                    placeholder="Add product tag"
                    setValue={form.setValue}
                  />

                  {form.watch("productStructure") === "simple" && (
                    <>
                      <FormPriceInput
                        control={form.control}
                        name="costPrice"
                        label="Cost Price"
                        placeholder="Cost Price"
                        min="0"
                      />
                      <FormPriceInput
                        control={form.control}
                        name="salesPrice"
                        label="Sale Price"
                        placeholder="Sale Price"
                        min="0"
                      />
                      <FormTextInput
                        control={form.control}
                        name="taxPercentage"
                        label="Tax Percentage (%)"
                        placeholder="e.g. 18"
                        type="number"
                        min="0"
                        max="100"
                      />
                    </>
                  )}

                  {form.watch("productStructure") === "simple" &&
                    form.watch("productType") === "physical" && (
                      <>
                        <FormTextInput
                          control={form.control}
                          name="stock"
                          label="Base Stock"
                          placeholder="Base stock quantity"
                          type="number"
                          min="0"
                        />
                        <FormTextInput
                          control={form.control}
                          name="minStockThreshold"
                          label="Minimum Stock"
                          placeholder="Minimum stock threshold"
                          type="number"
                          min="0"
                        />
                      </>
                    )}

                  {form.watch("productType") === "physical" &&
                    form.watch("productStructure") === "variant" && (
                      <>
                        <FormTextInput
                          control={form.control}
                          name="taxPercentage"
                          label="Tax Percentage (%)"
                          placeholder="e.g. 18"
                          type="number"
                          min="0"
                          max="100"
                        />
                        <FormVariantManagement
                          control={form.control}
                          name="product_variants"
                          label="Product Variants"
                          baseSKU={form.watch("sku") || ""}
                          baseSlug={form.watch("slug") || ""}
                          productName={form.watch("name") || ""}
                        />
                      </>
                    )}

                  {form.watch("productType") === "digital" && (
                    <div className="mt-4 space-y-6">
                      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Digital Product Configuration
                        </h3>

                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            File Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormTextInput
                              control={form.control}
                              name="fileUpload"
                              label="Digital File"
                              placeholder="Upload digital file"
                              type="file"
                              accept=".pdf,.doc,.docx,.txt,.csv,.json,.xml,.zip,.rar,.7z,.tar,.gz,.mp3,.mp4,.avi,.mov,.wmv,.flv,.webm,.jpg,.jpeg,.png,.gif,.svg,.webp"
                              onChange={handleFileUpload}
                            />
                            <FormTextInput
                              control={form.control}
                              name="fileSize"
                              label="File Size (MB)"
                              placeholder="Auto-calculated"
                              type="number"
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                          <div className="mt-4">
                            <FormTextInput
                              control={form.control}
                              name="downloadFormat"
                              label="Download Format"
                              placeholder="Auto-detected"
                              readOnly
                              className="bg-gray-100"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Licensing & Access
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormTextInput
                              control={form.control}
                              name="licenseType"
                              label="License Type"
                              placeholder="e.g., Single Use, Commercial, etc."
                            />
                            <FormTextInput
                              control={form.control}
                              name="downloadLimit"
                              label="Download Limit"
                              placeholder="Maximum downloads allowed"
                              type="number"
                              min="1"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 mt-4">
                          <FormTextInput
                            control={form.control}
                            name="taxPercentage"
                            label="Tax Percentage (%)"
                            placeholder="e.g. 18"
                            type="number"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <FormTextInput
                    control={form.control}
                    name="seoTitle"
                    label="SEO Title"
                    placeholder="SEO page title (optional)"
                  />

                  <FormTextarea
                    control={form.control}
                    name="seoDescription"
                    label="SEO Description"
                    placeholder="SEO meta description (optional)"
                  />

                  <FormTagsInput
                    control={form.control}
                    name="seoKeywords"
                    label="SEO Keywords"
                    placeholder="Add SEO keyword"
                    setValue={form.setValue}
                  />

                  {/* ✅ FIX 2: Canonical URL — readOnly is correct (auto-generated),
                      but we now use shouldValidate:true + shouldDirty:true in the
                      useEffect above so the controlled input always renders its value. */}
                  <FormTextInput
                    control={form.control}
                    name="seoCanonical"
                    label="Canonical URL"
                    placeholder="Auto-generated based on product slug"
                    readOnly
                  />

                  <FormTextInput
                    control={form.control}
                    name="seoRobots"
                    label="Robots Meta"
                    placeholder="Auto-generated based on stock and published status"
                    readOnly
                  />

                  {/* ✅ FIX 3: OG Title and OG Description must NOT be readOnly —
                      they are editable fields that the user fills in manually. */}
                  <FormTextInput
                    control={form.control}
                    name="seoOgTitle"
                    label="Open Graph Title"
                    placeholder="Open Graph title for social media"
                    // ← no readOnly here
                  />

                  <FormTextarea
                    control={form.control}
                    name="seoOgDescription"
                    label="Open Graph Description"
                    placeholder="Open Graph description for social media"
                    // ← no readOnly here
                  />

                  <FormTextInput
                    control={form.control}
                    name="seoOgImage"
                    label="Open Graph Image URL"
                    placeholder={(() => {
                      try {
                        return (
                          getOgImagePreview() ||
                          "Auto-generated from product/variant images"
                        );
                      } catch (error) {
                        return "Auto-generated from product/variant images";
                      }
                    })()}
                    readOnly
                  />
                </div>
              </FormSheetBody>

              <FormSheetFooter>
                <FormSubmitButton isPending={isPending} className="w-full">
                  {submitButtonText}
                </FormSubmitButton>
              </FormSheetFooter>
            </FormSheetContent>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}