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
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

import {
  FormSheetContent,
  FormSheetBody,
  FormSheetHeader,
  FormSheetFooter,
} from "@/components/shared/form/FormSheet";
import {
  FormTextInput,
  FormImageInput,
  FormDatetimeInput,
  FormDiscountInput,
  FormTextarea,
  FormSelect,
  FormNumberInput,
  FormSwitch,
  FormTagsInput,
} from "@/components/shared/form";
import { DatePicker } from "@/components/shared/DatePicker";
import { TimePicker } from "@/components/shared/TimePicker";
import FormSearchableSelect from "@/components/shared/form/FormSearchableSelect";
import FormMultipleCategorySubcategoryInput from "@/components/shared/form/FormMultipleCategorySubcategoryInput";
import { FormSubmitButton } from "@/components/shared/form/FormSubmitButton";

import { couponFormSchema, CouponFormData } from "./schema";
import { CouponServerActionResponse } from "@/types/server-action";
import { Switch } from "@/components/ui/switch";

// Fetch functions for FormSearchableSelect
const fetchProducts = async (search?: string) => {
  const { fetchProductsDropdown } = await import("@/services/products/products");
  return fetchProductsDropdown(search);
};

const fetchVariants = async (search?: string) => {
  const { fetchVariantsDropdown } = await import("@/services/variants/variants");
  return fetchVariantsDropdown(search);
};

type BaseCouponFormProps = {
  title: string;
  description: string;
  submitButtonText: string;
  actionVerb: string;
  children: React.ReactNode;
  action: (payload: CouponFormData) => Promise<CouponServerActionResponse>;
};

type AddCouponFormProps = BaseCouponFormProps & {
  initialData?: never;
  previewImage?: never;
};

type EditCouponFormProps = BaseCouponFormProps & {
  initialData: Partial<CouponFormData>;
  previewImage?: string;
};

type CouponFormProps = AddCouponFormProps | EditCouponFormProps;

const defaultValues: CouponFormData = {
  campaignName: "",
  code: "",
  description: "",
  image: undefined,
  discountType: "percentage",
  discountValue: 0,
  cashbackAmount: 0,
  minPurchase: 0,
  maxDiscount: 0,
  usageLimit: undefined,
  limitPerUser: undefined,
  startDate: new Date(),
  endDate: new Date(),
  isActive: true,
  published: true,
  autoApply: false,
  firstOrderOnly: false,
  newUserOnly: false,
  priority: 0,
  applicableCategories: [],
  applicableProducts: [],
  applicableVariants: [],
  applicableUsers: [],
  excludedCategories: [],
  excludedProducts: [],
  excludedVariants: [],
  visibilityOptions: {
    showOnCheckout: true,
    showOnHomepage: false,
    showOnProductPage: false,
    showInCart: true,
  },
  bogoConfig: {
    buyQuantity: 1,
    getQuantity: 1,
    buyProducts: [],
    getProducts: [],
    buyCategories: [],
    getCategories: [],
  },
};

export default function CouponFormSheet({
  title,
  description,
  submitButtonText,
  actionVerb,
  initialData,
  previewImage,
  children,
  action,
}: CouponFormProps) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [container, setContainer] = useState(null);
  const imageDropzoneRef = useRef<HTMLDivElement>(null);

  // Format initial data dates if they exist
  const getInitialValues = () => {
    if (!initialData) return defaultValues;
    
    // Helper function to map backend category format to frontend format
    const mapCategories = (backendCategories: any[]) => {
      console.log("mapCategories - input:", backendCategories);
      if (!backendCategories || !Array.isArray(backendCategories)) {
        console.log("mapCategories - returning empty array");
        return [];
      }
      
      const mapped = backendCategories.map(cat => ({
        categoryId: typeof cat.category === 'string' ? cat.category : cat.category?.$oid || cat.category?.toString(),
        categoryName: cat.categoryName || undefined, // Will be populated by FormMultipleCategorySubcategoryInput
        subcategoryIds: (cat.subcategories || []).map((sub: any) => 
          typeof sub === 'string' ? sub : sub.$oid || sub.toString()
        ),
        subcategoryNames: [], // Will be populated by FormMultipleCategorySubcategoryInput
      }));
      
      console.log("mapCategories - output:", mapped);
      return mapped;
    };
    
    const mappedData = {
      ...defaultValues,
      ...initialData,
      // Categories are already in frontend format, use them directly
      applicableCategories: initialData.applicableCategories || [],
      excludedCategories: initialData.excludedCategories || [],
      // Only map if the fields don't already exist (data coming directly from table)
      applicableProducts: initialData.applicableProducts || ((initialData as any).applied_products || []).map((item: any) => 
        typeof item === 'string' ? item : item.$oid || item.toString()
      ),
      applicableVariants: initialData.applicableVariants || ((initialData as any).applied_variants || []).map((item: any) => 
        typeof item === 'string' ? item : item.$oid || item.toString()
      ),
      excludedProducts: initialData.excludedProducts || ((initialData as any).excluded_products || []).map((item: any) => 
        typeof item === 'string' ? item : item.$oid || item.toString()
      ),
      excludedVariants: initialData.excludedVariants || ((initialData as any).excluded_variants || []).map((item: any) => 
        typeof item === 'string' ? item : item.$oid || item.toString()
      ),
      // Ensure dates are Date objects for the form
      startDate: initialData.startDate ? new Date(initialData.startDate) : new Date(),
      endDate: initialData.endDate ? new Date(initialData.endDate) : new Date(new Date().setDate(new Date().getDate() + 7)),
    };
    
    console.log("getInitialValues - final mappedData.applicableCategories:", mappedData.applicableCategories);
    console.log("getInitialValues - final mappedData.excludedCategories:", mappedData.excludedCategories);
    console.log("getInitialValues - mappedData:", mappedData);
    return mappedData;
  };

  const form = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: defaultValues,
  });

  // Reset form with initial data when it changes
  useEffect(() => {
    console.log("useEffect triggered - initialData:", initialData);
    if (initialData) {
      const initialValues = getInitialValues();
      console.log("Resetting form with values:", initialValues);
      form.reset(initialValues);
    } else {
      console.log("No initialData provided");
    }
  }, [initialData, form]);

  // Watch applicableCategories to disable excludedCategories when needed
  const applicableCategories = useWatch({
    control: form.control,
    name: "applicableCategories",
  });

  const excludedCategories = useWatch({
    control: form.control,
    name: "excludedCategories",
  });

  const isExcludedCategoriesDisabled = applicableCategories && applicableCategories.length > 0;
  const isApplicableCategoriesDisabled = excludedCategories && excludedCategories.length > 0;

  // Watch for specific user selection to disable firstOrderOnly and newUserOnly
  const applicableUsers = useWatch({
    control: form.control,
    name: "applicableUsers",
  });

  const newUserOnly = useWatch({
    control: form.control,
    name: "newUserOnly",
  });

  const firstOrderOnly = useWatch({
    control: form.control,
    name: "firstOrderOnly",
  });

  const isFirstOrderOnlyDisabled = applicableUsers && applicableUsers.length > 0;
  const isNewUserOnlyDisabled = applicableUsers && applicableUsers.length > 0;
  const isSpecificUserDisabled = newUserOnly;
  const isFirstOrderAlsoDisabledByNewUser = newUserOnly;
  const isNewUserAlsoDisabledByFirstOrder = firstOrderOnly;

  // Combined disabled state for firstOrderOnly
  const isFirstOrderOnlyFullyDisabled = isFirstOrderOnlyDisabled || isFirstOrderAlsoDisabledByNewUser;

  // Combined disabled state for newUserOnly
  const isNewUserOnlyFullyDisabled = isNewUserOnlyDisabled || isNewUserAlsoDisabledByFirstOrder;

  // Watch for selected products to filter variants
  const selectedProducts = useWatch({
    control: form.control,
    name: "applicableProducts",
  });

  // Watch for excluded products to filter excluded variants
  const excludedProducts = useWatch({
    control: form.control,
    name: "excludedProducts",
  });

  // Check if any selected products are variant products
  const [selectedProductDetails, setSelectedProductDetails] = useState<any[]>([]);
  const [excludedProductDetails, setExcludedProductDetails] = useState<any[]>([]);
  
  // Fetch product details when selected products change
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!selectedProducts || selectedProducts.length === 0) {
        setSelectedProductDetails([]);
        return;
      }
      
      try {
        const { fetchProductsDropdown } = await import("@/services/products/products");
        const products = await fetchProductsDropdown();
        const selectedDetails = products.filter(product => selectedProducts.includes(product._id));
        setSelectedProductDetails(selectedDetails);
      } catch (error) {
        console.error("Error fetching product details:", error);
        setSelectedProductDetails([]);
      }
    };
    
    fetchProductDetails();
  }, [selectedProducts]);

  // Fetch excluded product details when excluded products change
  useEffect(() => {
    const fetchExcludedProductDetails = async () => {
      if (!excludedProducts || excludedProducts.length === 0) {
        setExcludedProductDetails([]);
        return;
      }
      
      try {
        const { fetchProductsDropdown } = await import("@/services/products/products");
        const products = await fetchProductsDropdown();
        const excludedDetails = products.filter(product => excludedProducts.includes(product._id));
        setExcludedProductDetails(excludedDetails);
      } catch (error) {
        console.error("Error fetching excluded product details:", error);
        setExcludedProductDetails([]);
      }
    };
    
    fetchExcludedProductDetails();
  }, [excludedProducts]);

  // Mutual exclusion logic for products
  const isExcludedProductsDisabled = selectedProducts && selectedProducts.length > 0;
  const isAppliedProductsDisabled = excludedProducts && excludedProducts.length > 0;

  // Clear excluded products when applied products is selected
  useEffect(() => {
    if (isExcludedProductsDisabled) {
      form.setValue("excludedProducts", []);
    }
  }, [isExcludedProductsDisabled, form]);

  // Clear applied products when excluded products is selected
  useEffect(() => {
    if (isAppliedProductsDisabled) {
      form.setValue("applicableProducts", []);
    }
  }, [isAppliedProductsDisabled, form]);

  // Smart fetch function that filters products by selected categories
  const fetchProductsFiltered = async (search?: string) => {
    const { fetchProductsDropdown } = await import("@/services/products/products");
    
    // If applicable categories selected, filter products by those categories
    if (applicableCategories && applicableCategories.length > 0) {
      console.log('Fetching products for categories:', applicableCategories);
      const allProducts = await fetchProductsDropdown(search);
      console.log('All products fetched:', allProducts.length);
      
      // Extract category IDs from the selected categories
      const selectedCategoryIds = applicableCategories.map(item => 
        typeof item === 'string' ? item : item.categoryId
      ).filter(Boolean);
      console.log('Selected category IDs:', selectedCategoryIds);
      
      // Filter products to only those in selected categories
      const filteredProducts = allProducts.filter(product => {
        console.log('Checking product:', product.name, 'categories:', product.categories);
        
        if (!product.categories || product.categories.length === 0) {
          console.log('Product has no categories:', product.name);
          return false;
        }
        
        // Check if product belongs to any selected category
        const belongsToCategory = product.categories.some(productCategory => {
          const categoryId = typeof productCategory.category === 'string' 
            ? productCategory.category 
            : productCategory.category?._id || productCategory.category?.id;
          return categoryId && selectedCategoryIds.includes(categoryId);
        });
        
        console.log('Product category check:', product.name, 'belongsToCategory:', belongsToCategory);
        
        if (belongsToCategory) {
          console.log('Product matches category:', product.name, product.categories);
        }
        
        return belongsToCategory;
      });
      
      console.log('Filtered products:', filteredProducts.length);
      return filteredProducts;
    }
    
    // If no categories selected, return all products
    console.log('No categories selected, returning all products');
    return fetchProductsDropdown(search);
  };

  // Smart fetch function that filters excluded products by selected excluded categories
  const fetchExcludedProductsFiltered = async (search?: string) => {
    const { fetchProductsDropdown } = await import("@/services/products/products");
    
    // If excluded categories selected, filter products by those categories
    if (excludedCategories && excludedCategories.length > 0) {
      const allProducts = await fetchProductsDropdown(search);
      
      // Extract category IDs from the selected excluded categories
      const selectedCategoryIds = excludedCategories.map(item => 
        typeof item === 'string' ? item : item.categoryId
      ).filter(Boolean);
      
      // Filter products to only those in selected excluded categories
      const filteredProducts = allProducts.filter(product => {
        if (!product.categories || product.categories.length === 0) {
          return false;
        }
        
        // Check if product belongs to any selected excluded category
        return product.categories.some(productCategory => {
          const categoryId = typeof productCategory.category === 'string' 
            ? productCategory.category 
            : productCategory.category?._id || productCategory.category?.id;
          return categoryId && selectedCategoryIds.includes(categoryId);
        });
      });
      
      return filteredProducts;
    }
    
    // If no excluded categories selected, return all products
    return fetchProductsDropdown(search);
  };

  // Clear excludedCategories when applicableCategories is selected
  useEffect(() => {
    if (isExcludedCategoriesDisabled) {
      form.setValue("excludedCategories", []);
    }
  }, [isExcludedCategoriesDisabled, form]);

  // Clear applicableCategories when excludedCategories is selected
  useEffect(() => {
    if (isApplicableCategoriesDisabled) {
      form.setValue("applicableCategories", []);
    }
  }, [isApplicableCategoriesDisabled, form]);

  // Clear firstOrderOnly and newUserOnly when specific user is selected
  useEffect(() => {
    if (isFirstOrderOnlyDisabled) {
      form.setValue("firstOrderOnly", false);
      form.setValue("newUserOnly", false);
    }
  }, [isFirstOrderOnlyDisabled, form]);

  // Clear specific users and firstOrderOnly when newUserOnly is selected
  useEffect(() => {
    if (isSpecificUserDisabled) {
      form.setValue("applicableUsers", []);
      form.setValue("firstOrderOnly", false);
    }
  }, [isSpecificUserDisabled, form]);

  // Clear newUserOnly when firstOrderOnly is selected
  useEffect(() => {
    if (isNewUserAlsoDisabledByFirstOrder) {
      form.setValue("newUserOnly", false);
    }
  }, [isNewUserAlsoDisabledByFirstOrder, form]);

  useEffect(() => {
    form.reset({
      ...defaultValues,
      ...initialData,
    });
  }, [form, initialData]);

  const discountType = form.watch("discountType");
  const visibilityOptions = form.watch("visibilityOptions");
  const bogoConfig = form.watch("bogoConfig");

  // Watch applicability fields
  const applicableProducts = form.watch("applicableProducts");
  const applicableVariants = form.watch("applicableVariants");

  // Watch exclusions fields
  const excludedVariants = form.watch("excludedVariants");

  // Check if any applicability values are selected
  const hasApplicabilityValues = 
    (applicableCategories && applicableCategories.length > 0) ||
    (applicableProducts && applicableProducts.length > 0) ||
    (applicableVariants && applicableVariants.length > 0) ||
    (applicableUsers && applicableUsers.length > 0);

  // Check if any exclusion values are selected
  const hasExclusionValues = 
    (excludedCategories && excludedCategories.length > 0) ||
    (excludedProducts && excludedProducts.length > 0) ||
    (excludedVariants && excludedVariants.length > 0);

  // Disable logic - only disable if the other section has values AND this section is empty
  const shouldDisableApplicability = hasExclusionValues && !hasApplicabilityValues;
  const shouldDisableExclusions = hasApplicabilityValues && !hasExclusionValues;

  const onSubmit = (data: CouponFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Applicable Categories:", data.applicableCategories);
    console.log("Excluded Categories:", data.excludedCategories);
    console.log("Applicable Products:", data.applicableProducts);
    console.log("Excluded Products:", data.excludedProducts);
    console.log("Applicable Users:", data.applicableUsers);
    
    startTransition(async () => {
      // Pass the raw form data directly to the action
      // The action will handle the transformation to backend format
      const result = await action(data);

      if ("validationErrors" in result) {
        console.error("Server validation errors:", result.validationErrors);
        Object.keys(result.validationErrors).forEach((key) => {
          form.setError(key as keyof CouponFormData, {
            message: result.validationErrors![key],
          });
        });

        form.setFocus(
          Object.keys(result.validationErrors)[0] as keyof CouponFormData
        );
      } else if ("dbError" in result) {
        toast.error(result.dbError);
      } else if ("coupon" in result) {
        form.reset();
        const couponName =
          result.coupon?.campaign_name || result.coupon?.code || "Coupon";
        toast.success(
          `Coupon "${couponName}" ${actionVerb} successfully!`,
          { position: "top-center" }
        );
        queryClient.invalidateQueries({ queryKey: ["coupons"] });
        setIsSheetOpen(false);
      } else {
        form.reset();
        toast.success(
          `Coupon ${actionVerb} successfully!`,
          { position: "top-center" }
        );
        queryClient.invalidateQueries({ queryKey: ["coupons"] });
        setIsSheetOpen(false);
      }
    });
  };

  const onInvalid = (errors: FieldErrors<CouponFormData>) => {
    console.log("Form validation errors:", errors);
    
    // Focus on the first error field
    const firstErrorField = Object.keys(errors)[0] as keyof CouponFormData;
    if (firstErrorField) {
      form.setFocus(firstErrorField);
    }
    
    // Show toast with validation error summary
    const errorMessages = Object.entries(errors)
      .filter(([_, error]) => error?.message)
      .map(([field, error]) => `${field}: ${error.message}`)
      .join(', ');
    
    if (errorMessages) {
      toast.error(`Please fix the following errors: ${errorMessages}`);
    }
  };

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
                        <div className="space-y-4">
                          <FormTextInput
                            control={form.control}
                            name="campaignName"
                            label="Campaign Name"
                            placeholder="Campaign Name"
                          />
                          <FormTextInput
                            control={form.control}
                            name="code"
                            label="Campaign Code"
                            placeholder="Campaign Code"
                          />
                          <FormTextarea
                            control={form.control}
                            name="description"
                            label="Description"
                            placeholder="Describe the campaign"
                          />
                          <FormImageInput
                            control={form.control}
                            name="image"
                            label="Coupon Image"
                            previewImage={previewImage}
                            ref={imageDropzoneRef}
                          />
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <FormLabel>Start Date</FormLabel>
                              <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <DatePicker
                                        date={field.value ? field.value.toISOString().split('T')[0] : undefined}
                                        setDate={(date) => {
                                          if (date) {
                                            const newDate = new Date(date);
                                            const currentTime = field.value ? field.value.toTimeString().split(' ')[0].substring(0, 5) : '00:00';
                                            newDate.setHours(parseInt(currentTime.split(':')[0]), parseInt(currentTime.split(':')[1]));
                                            field.onChange(newDate);
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
                              <FormLabel>Start Time</FormLabel>
                              <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <TimePicker
                                        time={field.value ? field.value.toTimeString().split(' ')[0].substring(0, 5) : undefined}
                                        setTime={(time) => {
                                          if (time) {
                                            const newDate = field.value ? new Date(field.value) : new Date();
                                            const [hours, minutes] = time.split(':');
                                            newDate.setHours(parseInt(hours), parseInt(minutes));
                                            field.onChange(newDate);
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
                            <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <FormLabel>End Date</FormLabel>
                              <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <DatePicker
                                        date={field.value ? field.value.toISOString().split('T')[0] : undefined}
                                        setDate={(date) => {
                                          if (date) {
                                            const newDate = new Date(date);
                                            const currentTime = field.value ? field.value.toTimeString().split(' ')[0].substring(0, 5) : '00:00';
                                            newDate.setHours(parseInt(currentTime.split(':')[0]), parseInt(currentTime.split(':')[1]));
                                            field.onChange(newDate);
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
                              <FormLabel>End Time</FormLabel>
                              <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <TimePicker
                                        time={field.value ? field.value.toTimeString().split(' ')[0].substring(0, 5) : undefined}
                                        setTime={(time) => {
                                          if (time) {
                                            const newDate = field.value ? new Date(field.value) : new Date();
                                            const [hours, minutes] = time.split(':');
                                            newDate.setHours(parseInt(hours), parseInt(minutes));
                                            field.onChange(newDate);
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
                      </div>

                      {/* Discount Configuration Section */}
                      <div className="border rounded-lg p-4 space-y-4 mb-6">
                        <h3 className="text-lg font-medium">Discount Configuration</h3>
                        <div className={discountType === "free_shipping" || discountType === "bogo" ? "space-y-4" : "grid md:grid-cols-2 gap-4"}>
                          <FormSelect
                            control={form.control}
                            name="discountType"
                            label="Discount Type"
                            options={[
                              { label: "Percentage", value: "percentage" },
                              { label: "Fixed Amount", value: "fixed" },
                              { label: "Free Shipping", value: "free_shipping" },
                              { label: "Cashback", value: "cashback" },
                            ]}
                          />
                          {(discountType === "percentage" || discountType === "fixed") && (
                            <FormDiscountInput
                              control={form.control}
                              name="discountValue"
                              label={discountType === "percentage" ? "Discount (%)" : "Discount Amount"}
                              placeholder={
                                discountType === "percentage"
                                  ? "Percentage discount"
                                  : "Fixed discount amount"
                              }
                              isPercentageField={"discountType" as any}
                              form={form}
                            />
                          )}
                          {discountType === "cashback" && (
                            <FormNumberInput
                              control={form.control}
                              name="cashbackAmount"
                              label="Cashback Amount"
                              placeholder="Enter cashback amount"
                              min={0}
                            />
                          )}
                        </div>
                      </div>

                      {/* Usage Rules Section */}
                      <div className="border rounded-lg p-4 space-y-4 mb-6">
                        <h3 className="text-lg font-medium">Usage Rules</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormNumberInput
                            control={form.control}
                            name="minPurchase"
                            label="Minimum Purchase Amount"
                            placeholder="0"
                            min={0}
                          />
                          {(discountType === "percentage" || discountType === "fixed") && (
                            <FormNumberInput
                              control={form.control}
                              name="maxDiscount"
                              label="Maximum Discount Amount"
                              placeholder="0"
                              min={0}
                            />
                          )}
                          <FormNumberInput
                            control={form.control}
                            name="usageLimit"
                            label="Global Usage Limit"
                            placeholder="Unlimited"
                            min={1}
                          />
                          <FormNumberInput
                            control={form.control}
                            name="limitPerUser"
                            label="Per User Limit"
                            placeholder="Unlimited"
                            min={1}
                          />
                        </div>
                        <FormNumberInput
                          control={form.control}
                          name="priority"
                          label="Coupon Priority"
                          placeholder="0"
                          min={0}
                        />
                      </div>

                      {/* Eligibility Rules Section */}
                      <div className="border rounded-lg p-4 space-y-4 mb-6">
                        <h3 className="text-lg font-medium">Eligibility Rules</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name="isActive"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Active
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name="autoApply"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                      disabled={discountType === "percentage" || discountType === "fixed"}
                                    />
                                  </FormControl>
                                  <FormLabel className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed ${(discountType === "percentage" || discountType === "fixed") ? "opacity-50" : ""}`}>
                                    Auto Apply
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name="firstOrderOnly"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                      disabled={isFirstOrderOnlyFullyDisabled}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    First Order Only
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name="newUserOnly"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                      disabled={isNewUserOnlyFullyDisabled}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    New User Only
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="min-w-[120px]">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Specific Users
                            </label>
                          </div>
                          <div className="flex-1">
                            <FormSearchableSelect
                              control={form.control}
                              name="applicableUsers"
                              placeholder="Select users"
                              fetchOptions={async (search) => {
                                const { fetchUsersDropdown } = await import("@/services/users/users");
                                return fetchUsersDropdown(search);
                              }}
                              itemType="user"
                              disabled={shouldDisableApplicability}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Visibility Settings Section */}
                      <div className="border rounded-lg p-4 space-y-4 mb-6">
                        <h3 className="text-lg font-medium">Visibility Settings</h3>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name="visibilityOptions.showOnCheckout"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Show on Checkout
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name="visibilityOptions.showOnHomepage"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Show on Homepage
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name="visibilityOptions.showOnProductPage"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Show on Product Page
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name="visibilityOptions.showInCart"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Switch 
                                      checked={field.value} 
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Show in Cart
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Applicability Section */}
                      <div className="border rounded-lg p-4 space-y-4 mb-6">
                        <h3 className="text-lg font-medium">Applicability</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1">
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Applicable Categories
                              </label>
                            </div>
                            <div className="col-span-3">
                              <FormMultipleCategorySubcategoryInput
                                control={form.control}
                                name="applicableCategories"
                                setValue={form.setValue}
                                watch={form.watch}
                                placeholder="Select categories"
                                disabled={shouldDisableApplicability}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1">
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Applicable Products
                              </label>
                            </div>
                            <div className="col-span-3">
                              <FormSearchableSelect
                                control={form.control}
                                name="applicableProducts"
                                placeholder="Select products"
                                fetchOptions={fetchProductsFiltered}
                                itemType="product"
                                disabled={shouldDisableApplicability}
                              />
                            </div>
                          </div>
                          {selectedProductDetails.some(product => product.product_structure === 'variant') && (
                            <div className="grid grid-cols-4 gap-4">
                              <div className="col-span-1">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Applicable Variants
                                </label>
                              </div>
                              <div className="col-span-3">
                                <FormSearchableSelect
                                  control={form.control}
                                  name="applicableVariants"
                                  placeholder="Select variants"
                                  fetchOptions={fetchVariants}
                                  itemType="variant"
                                  disabled={shouldDisableApplicability}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Exclusions Section */}
                      <div className="border rounded-lg p-4 space-y-4 mb-6">
                        <h3 className="text-lg font-medium">Exclusions</h3>
                        <div className="space-y-4">
                          <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1">
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Excluded Categories
                              </label>
                            </div>
                            <div className="col-span-3">
                              <FormMultipleCategorySubcategoryInput
                                control={form.control}
                                name="excludedCategories"
                                setValue={form.setValue}
                                watch={form.watch}
                                placeholder="Select categories to exclude"
                                disabled={shouldDisableExclusions}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-1">
                              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Excluded Products
                              </label>
                            </div>
                            <div className="col-span-3">
                              <FormSearchableSelect
                                control={form.control}
                                name="excludedProducts"
                                placeholder="Select products to exclude"
                                fetchOptions={fetchExcludedProductsFiltered}
                                itemType="product"
                                disabled={shouldDisableExclusions}
                              />
                            </div>
                          </div>
                          {excludedProductDetails.some(product => product.product_structure === 'variant') && (
                            <div className="grid grid-cols-4 gap-4">
                              <div className="col-span-1">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                  Excluded Variants
                                </label>
                              </div>
                              <div className="col-span-3">
                                <FormSearchableSelect
                                  control={form.control}
                                  name="excludedVariants"
                                  placeholder="Select variants to exclude"
                                  fetchOptions={fetchVariants}
                                  itemType="variant"
                                  disabled={shouldDisableExclusions}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                  </FormSheetBody>

                  <FormSheetFooter>
                    <FormSubmitButton isPending={isPending}>
                      {submitButtonText}
                    </FormSubmitButton>
                  </FormSheetFooter>
                </FormSheetContent>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      );
};
