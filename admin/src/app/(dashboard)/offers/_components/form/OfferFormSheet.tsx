"use client";

import { useRef, LegacyRef, useState, useTransition, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FieldErrors, useWatch } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

import {
  FormSheetContent,
  FormSheetBody,
  FormSheetHeader,
  FormSheetFooter,
} from "@/components/shared/form/FormSheet";
import {
  FormTextInput,
  FormTextarea,
  FormSlugInput,
  FormSelect,
  FormSwitch,
  FormDatetimeInput,
  FormNumberInput,
  FormImageInput,
} from "@/components/shared/form";
import { DatePicker } from "@/components/shared/DatePicker";
import { TimePicker } from "@/components/shared/TimePicker";
import FormSearchableSelect from "@/components/shared/form/FormSearchableSelect";
import FormMultipleCategorySubcategoryInput from "@/components/shared/form/FormMultipleCategorySubcategoryInput";
import { FormSubmitButton } from "@/components/shared/form/FormSubmitButton";
import { Switch } from "@/components/ui/switch";
import { uploadFile } from "@/lib/firebase/storage";
import { offerFormSchema, OfferFormData } from "./schema";
import { createOffer, updateOffer } from "@/services/offers/offers";
import { Offer } from "@/services/offers/offers";

type OfferFormProps = {
  title: string;
  description: string;
  submitButtonText: string;
  actionVerb: string;
  children: React.ReactNode;
  initialData?: Partial<OfferFormData>;
  offerId?: string;
};

export default function OfferFormSheet({
  title,
  description,
  submitButtonText,
  actionVerb,
  initialData,
  offerId,
  children,
}: OfferFormProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [container, setContainer] = useState(null);
  const imageDropzoneRef = useRef<HTMLDivElement>(null);

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      image_url: undefined,
      banner_image: undefined,
      offer_type: "flash",
      priority: 50,
      auto_apply: false,
      published: false,
      start_date: "",
      end_date: "",
      usage_limit: undefined,
      limit_per_user: undefined,
      allow_guest_users: true,
      applicable_users: [],
      excluded_users: [],
      bogo_config: {
        buy: {
          scope: 'product',
          product_ids: [],
          category_ids: [],
          quantity: 1,
        },
        get: {
          scope: 'same',
          product_ids: [],
          category_ids: [],
          quantity: 1,
          discount_type: 'FREE',
          discount_value: undefined,
        },
        apply_to: 'cheapest',
        max_free_quantity: 1,
      },
      flash_config: {
        discount_type: "percentage",
        discount_value: 0,
        max_discount: undefined,
        applicable_products: [],
        applicable_categories: [],
        customer_groups: [],
      },
      category_config: undefined,
      storewide_config: undefined,
      ...initialData,
    },
  });

  // Reset form with initialData after mount
  useEffect(() => {
    if (initialData) {
      form.reset({
        title: "",
        slug: "",
        description: "",
        image_url: undefined,
        banner_image: undefined,
        offer_type: "flash",
        priority: 50,
        auto_apply: false,
        published: false,
        start_date: "",
        end_date: "",
        usage_limit: undefined,
        limit_per_user: undefined,
        allow_guest_users: true,
        applicable_users: [],
        excluded_users: [],
        flash_config: {
          discount_type: "percentage",
          discount_value: 0,
          max_discount: undefined,
          applicable_products: [],
          applicable_categories: [],
          customer_groups: [],
        },
        ...initialData,
      });
    }
  }, [initialData, form]);

  // Watch offer type to show/hide relevant configuration
  const offerType = form.watch("offer_type");

  // Reset configuration when offer type changes
  useEffect(() => {
    form.setValue("bogo_config", {
      buy: {
        scope: 'product',
        product_ids: [],
        category_ids: [],
        quantity: 1,
      },
      get: {
        scope: 'same',
        product_ids: [],
        category_ids: [],
        quantity: 1,
        discount_type: 'FREE',
        discount_value: undefined,
      },
      apply_to: 'cheapest',
      max_free_quantity: 1,
    });
    form.setValue("flash_config", {
      discount_type: "percentage",
      discount_value: 0,
      max_discount: undefined,
      applicable_products: [],
      applicable_categories: [],
      customer_groups: [],
    });
    form.setValue("category_config", undefined);
    form.setValue("storewide_config", undefined);
  }, [offerType, form]);

  const onSubmit = async (data: OfferFormData) => {
    console.log('=== OFFER FORM SUBMISSION STARTED ===');
    console.log('Form submission data:', data);

    startTransition(async () => {
      try {
        // Handle file uploads to Firebase Storage
        let imageUrl = data.image_url;
        let bannerImageUrl = data.banner_image;

        // Upload offer image to Firebase Storage if it's a File
        if (data.image_url instanceof File) {
          try {
            imageUrl = await uploadFile(data.image_url, 'offers/images');
            console.log('Offer image uploaded to Firebase:', imageUrl);
          } catch (error) {
            console.error('Error uploading offer image:', error);
            toast.error('Failed to upload offer image');
            return;
          }
        }

        // Upload banner image to Firebase Storage if it's a File
        if (data.banner_image instanceof File) {
          try {
            bannerImageUrl = await uploadFile(data.banner_image, 'offers/banners');
            console.log('Banner image uploaded to Firebase:', bannerImageUrl);
          } catch (error) {
            console.error('Error uploading banner image:', error);
            toast.error('Failed to upload banner image');
            return;
          }
        }

        // Prepare submission data with uploaded URLs
        const submissionData = {
          ...data,
          image_url: imageUrl,
          banner_image: bannerImageUrl,
        };

        // Remove File objects from submission data and filter configs based on offer type
        const { image_url: _img, banner_image: _banner, ...cleanData } = submissionData;

        // Only include the relevant configuration based on offer type
        const filteredData = {
          ...cleanData,
          image_url: submissionData.image_url, // Ensure images are preserved
          banner_image: submissionData.banner_image,
          published: !!submissionData.published, // Explicitly include published
          ...(cleanData.offer_type === 'bogo' && { bogo_config: cleanData.bogo_config }),
          ...(cleanData.offer_type === 'flash' && { flash_config: cleanData.flash_config }),
          ...(cleanData.offer_type === 'category_discount' && { category_config: cleanData.category_config }),
          ...(cleanData.offer_type === 'storewide' && { storewide_config: cleanData.storewide_config }),
        };

        // Remove other configs to avoid backend validation conflicts
        delete filteredData.bogo_config;
        delete filteredData.flash_config;
        delete filteredData.category_config;
        delete filteredData.storewide_config;

        // Re-add the correct config
        if (cleanData.offer_type === 'bogo') {
          filteredData.bogo_config = cleanData.bogo_config;
        } else if (cleanData.offer_type === 'flash') {
          filteredData.flash_config = cleanData.flash_config;
        } else if (cleanData.offer_type === 'category_discount') {
          filteredData.category_config = cleanData.category_config;
        } else if (cleanData.offer_type === 'storewide') {
          filteredData.storewide_config = cleanData.storewide_config;
        }

        console.log('Final submission data:', filteredData);

        let result;

        if (offerId) {
          result = await updateOffer({
            id: offerId,
            ...filteredData
          });
        } else {
          result = await createOffer(filteredData);
        }

        console.log('=== BACKEND RESPONSE ===', result);

        if (!result) {
          toast.error("No response received from server");
          return;
        }

        if (result.success) {
          toast.success(
            `Offer "${data.title}" ${actionVerb} successfully!`,
            { position: "top-center" }
          );
          queryClient.invalidateQueries({ queryKey: ["offers"] });

          try {
            // Reset form
            console.log("Resetting form...");
            form.reset({
              title: "",
              slug: "",
              description: "",
              image_url: undefined,
              banner_image: undefined,
              offer_type: "flash",
              priority: 50,
              auto_apply: false,
              published: false,
              start_date: "",
              end_date: "",
              usage_limit: undefined,
              limit_per_user: undefined,
              allow_guest_users: true,
              applicable_users: [],
              excluded_users: [],
              flash_config: {
                discount_type: "percentage",
                discount_value: 0,
                max_discount: undefined,
                applicable_products: [],
                applicable_categories: [],
                customer_groups: [],
              },
            });
          } catch (error) {
            console.error("Error resetting form:", error);
          }

          setIsSheetOpen(false);
        } else {
          toast.error("Failed to save offer");
        }
      } catch (error) {
        console.error('=== ACTION ERROR ===', error);
        toast.error("An error occurred while saving the offer");
      }
    });
  };

  const onInvalid = (errors: FieldErrors<OfferFormData>) => {
    console.log('=== FORM VALIDATION FAILED ===');
    console.log('Validation errors:', errors);

    // Show toast for first error
    const firstErrorKey = Object.keys(errors)[0];
    const firstError = errors[firstErrorKey as keyof OfferFormData];
    if (firstError && 'message' in firstError) {
      toast.error(`Validation error: ${firstError.message}`);
    }
  };

  const offerTypeOptions = [
    { label: "Flash Sale", value: "flash" },
    { label: "BOGO (Buy One Get One)", value: "bogo" },
    { label: "Category Discount", value: "category_discount" },
    { label: "Store-wide Discount", value: "storewide" },
  ];



  const discountTypeOptions = [
    { label: "Percentage", value: "percentage" },
    { label: "Fixed Amount", value: "fixed" },
  ];

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      {children}

      <SheetContent className="w-[90%] max-w-4xl">
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
                  {/* Basic Information Section */}
                  <div className="border rounded-lg p-4 space-y-4 mb-6">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <div className="space-y-4">
                      <FormTextInput
                        control={form.control}
                        name="title"
                        label="Offer Title"
                        placeholder="Enter offer title"
                      />

                      <FormSlugInput
                        form={form}
                        control={form.control}
                        name="slug"
                        label="Offer Slug"
                        placeholder="offer-slug"
                        generateSlugFrom="title"
                      />

                      <FormTextarea
                        control={form.control}
                        name="description"
                        label="Description"
                        placeholder="Describe your offer..."
                      />

                      <div className="space-y-4">
                        <FormImageInput
                          control={form.control}
                          name="image_url"
                          label="Offer Image"
                          ref={imageDropzoneRef}
                        />

                        <FormImageInput
                          control={form.control}
                          name="banner_image"
                          label="Banner Image"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <FormLabel>Start Date</FormLabel>
                          <FormField
                            control={form.control}
                            name="start_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <DatePicker
                                    date={field.value || undefined}
                                    setDate={(date) => {
                                      if (date) {
                                        field.onChange(date);
                                      }
                                    }}
                                    className="w-full"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="space-y-2">
                          <FormLabel>End Date</FormLabel>
                          <FormField
                            control={form.control}
                            name="end_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <DatePicker
                                    date={field.value || undefined}
                                    setDate={(date) => {
                                      if (date) {
                                        field.onChange(date);
                                      }
                                    }}
                                    className="w-full"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Offer Configuration Section */}
                  <div className="border rounded-lg p-4 space-y-4 mb-6">
                    <h3 className="text-lg font-medium">Offer Configuration</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormSelect
                          control={form.control}
                          name="offer_type"
                          label="Offer Type"
                          placeholder="Select offer type"
                          options={offerTypeOptions}
                        />

                        <FormNumberInput
                          control={form.control}
                          name="priority"
                          label="Priority"
                          placeholder="1-100"
                          min={1}
                          max={100}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name="auto_apply"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Auto Apply
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Usage Rules Section */}
                  <div className="border rounded-lg p-4 space-y-4 mb-6">
                    <h3 className="text-lg font-medium">Usage Rules</h3>
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <FormNumberInput
                          control={form.control}
                          name="usage_limit"
                          label="Usage Limit"
                          placeholder="Total usage limit"
                          min={1}
                        />

                        <FormNumberInput
                          control={form.control}
                          name="limit_per_user"
                          label="Limit Per User"
                          placeholder="Per user limit"
                          min={1}
                        />

                        <div className="flex items-center gap-2">
                          <FormField
                            control={form.control}
                            name="allow_guest_users"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Allow Guest Users
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Discount Settings Section - Dynamic based on offer type */}
                  <div className="border rounded-lg p-4 space-y-4 mb-6">
                    <h3 className="text-lg font-medium">Discount Settings</h3>

                    {offerType === "flash" && (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormSelect
                            control={form.control}
                            name="flash_config.discount_type"
                            label="Discount Type"
                            placeholder="Select discount type"
                            options={discountTypeOptions}
                          />

                          <FormNumberInput
                            control={form.control}
                            name="flash_config.discount_value"
                            label="Discount Value"
                            placeholder={form.watch("flash_config.discount_type") === "percentage" ? "0-100" : "Amount"}
                            min={0}
                            max={form.watch("flash_config.discount_type") === "percentage" ? 100 : undefined}
                          />
                        </div>

                        <FormNumberInput
                          control={form.control}
                          name="flash_config.max_discount"
                          label="Maximum Discount"
                          placeholder="0"
                          min={0}
                        />
                      </div>
                    )}

                    {offerType === "bogo" && (
                      <div className="space-y-6">
                        {/* Buy Section */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <h4 className="font-medium">Buy Configuration</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormSelect
                              control={form.control}
                              name="bogo_config.buy.scope"
                              label="Buy Scope"
                              placeholder="Select scope"
                              options={[
                                { value: "product", label: "Specific Products" },
                                { value: "category", label: "Product Categories" }
                              ]}
                            />
                            <FormNumberInput
                              control={form.control}
                              name="bogo_config.buy.quantity"
                              label="Buy Quantity"
                              placeholder="1"
                              min={1}
                            />
                          </div>
                          {form.watch("bogo_config.buy.scope") === "product" && (
                            <FormSearchableSelect
                              control={form.control}
                              name="bogo_config.buy.product_ids"
                              label="Buy Products"
                              placeholder="Search products..."
                              itemType="product"
                              fetchOptions={async (search) => {
                                const { fetchProductsDropdown } = await import("@/services/products/products");
                                return fetchProductsDropdown(search);
                              }}
                            />
                          )}
                          {form.watch("bogo_config.buy.scope") === "category" && (
                            <FormField
                              control={form.control}
                              name="bogo_config.buy.category_ids"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Buy Categories</FormLabel>
                                  <FormControl>
                                    <FormSearchableSelect
                                      control={form.control}
                                      name="bogo_config.buy.category_ids"
                                      label=""
                                      placeholder="Search categories..."
                                      itemType="category"
                                      fetchOptions={async (search) => {
                                        const { fetchCategoriesDropdown } = await import("@/services/categories");
                                        const categories = await fetchCategoriesDropdown();
                                        return categories.map(cat => ({
                                          _id: cat._id,
                                          name: cat.name,
                                          slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                                          displayName: cat.name
                                        }));
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* Get Section */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <h4 className="font-medium">Get Configuration</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormSelect
                              control={form.control}
                              name="bogo_config.get.scope"
                              label="Get Scope"
                              placeholder="Select scope"
                              options={[
                                { value: "same", label: "Same as Buy" },
                                { value: "product", label: "Specific Products" },
                                { value: "category", label: "Product Categories" }
                              ]}
                            />
                            <FormNumberInput
                              control={form.control}
                              name="bogo_config.get.quantity"
                              label="Get Quantity"
                              placeholder="1"
                              min={1}
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormSelect
                              control={form.control}
                              name="bogo_config.get.discount_type"
                              label="Discount Type"
                              placeholder="Select type"
                              options={[
                                { value: "FREE", label: "Free (100%)" },
                                { value: "PERCENT", label: "Percentage" }
                              ]}
                            />
                            {form.watch("bogo_config.get.discount_type") === "PERCENT" && (
                              <FormNumberInput
                                control={form.control}
                                name="bogo_config.get.discount_value"
                                label="Discount Percentage"
                                placeholder="1-100"
                                min={1}
                                max={100}
                              />
                            )}
                          </div>
                          {form.watch("bogo_config.get.scope") === "product" && (
                            <FormSearchableSelect
                              control={form.control}
                              name="bogo_config.get.product_ids"
                              label="Get Products"
                              placeholder="Search products..."
                              itemType="product"
                              fetchOptions={async (search) => {
                                const { fetchProductsDropdown } = await import("@/services/products/products");
                                return fetchProductsDropdown(search);
                              }}
                            />
                          )}
                          {form.watch("bogo_config.get.scope") === "category" && (
                            <FormField
                              control={form.control}
                              name="bogo_config.get.category_ids"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Get Categories</FormLabel>
                                  <FormControl>
                                    <FormSearchableSelect
                                      control={form.control}
                                      name="bogo_config.get.category_ids"
                                      label=""
                                      placeholder="Search categories..."
                                      itemType="category"
                                      fetchOptions={async (search) => {
                                        const { fetchCategoriesDropdown } = await import("@/services/categories");
                                        const categories = await fetchCategoriesDropdown();
                                        return categories.map(cat => ({
                                          _id: cat._id,
                                          name: cat.name,
                                          slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                                          displayName: cat.name
                                        }));
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* Application Rules */}
                        <div className="border rounded-lg p-4 space-y-4">
                          <h4 className="font-medium">Application Rules</h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <FormSelect
                              control={form.control}
                              name="bogo_config.apply_to"
                              label="Apply To"
                              placeholder="Select rule"
                              options={[
                                { value: "cheapest", label: "Cheapest Item" },
                                { value: "first_matched", label: "First Matched" }
                              ]}
                            />
                            <FormNumberInput
                              control={form.control}
                              name="bogo_config.max_free_quantity"
                              label="Max Free Quantity"
                              placeholder="Default: 1"
                              min={1}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {offerType === "category_discount" && (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormSelect
                            control={form.control}
                            name="category_config.discount_type"
                            label="Discount Type"
                            placeholder="Select discount type"
                            options={discountTypeOptions}
                          />

                          <FormNumberInput
                            control={form.control}
                            name="category_config.discount_value"
                            label="Discount Value"
                            placeholder={form.watch("category_config.discount_type") === "percentage" ? "0-100" : "Amount"}
                            min={0}
                            max={form.watch("category_config.discount_type") === "percentage" ? 100 : undefined}
                          />
                        </div>


                        <div className="grid md:grid-cols-2 gap-4">
                          <FormNumberInput
                            control={form.control}
                            name="category_config.max_discount"
                            label="Maximum Discount Amount"
                            placeholder="0"
                            min={0}
                          />
                        </div>
                      </div>
                    )}

                    {offerType === "storewide" && (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormSelect
                            control={form.control}
                            name="storewide_config.discount_type"
                            label="Discount Type"
                            placeholder="Select discount type"
                            options={discountTypeOptions}
                          />

                          <FormNumberInput
                            control={form.control}
                            name="storewide_config.discount_value"
                            label="Discount Value"
                            placeholder={form.watch("storewide_config.discount_type") === "percentage" ? "0-100" : "Amount"}
                            min={0}
                            max={form.watch("storewide_config.discount_type") === "percentage" ? 100 : undefined}
                          />
                        </div>


                        <div className="grid md:grid-cols-2 gap-4">
                          <FormNumberInput
                            control={form.control}
                            name="storewide_config.max_discount"
                            label="Maximum Discount Amount"
                            placeholder="0"
                            min={0}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </FormSheetBody>

              <FormSheetFooter>
                <FormSubmitButton
                  isPending={isPending}
                  className="w-full"
                >
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