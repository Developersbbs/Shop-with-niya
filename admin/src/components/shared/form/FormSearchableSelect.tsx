"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Control, FieldValues, Path, useWatch } from "react-hook-form";
import { Search, X, ChevronDown } from "lucide-react";

import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  displayName: string;
  role: string;
  is_active: boolean;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  product_structure?: 'simple' | 'variant';
  categories?: Array<{
    category: string;
    subcategories: string[];
  }>;
  displayName: string;
}

interface Variant {
  _id: string;
  name: string; // variant name (e.g., Blue)
  sku: string;
  selling_price: number;
  product_id: string;
  product_name: string;
  displayName: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  displayName: string;
}

type SearchableItem = User | Product | Variant | Category;

interface FormSearchableSelectProps<TFormData extends FieldValues> {
  control: Control<TFormData>;
  name: Path<TFormData>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  fetchOptions: (search?: string) => Promise<SearchableItem[]>;
  itemType?: 'user' | 'product' | 'variant' | 'category';
}

export default function FormSearchableSelect<TFormData extends FieldValues>({
  control,
  name,
  label,
  placeholder = "Search...",
  disabled = false,
  fetchOptions,
  itemType = "user",
}: FormSearchableSelectProps<TFormData>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Watch the field value to get selected IDs
  const fieldValue = useWatch({
    control,
    name,
  });

  const { data: itemsData, isLoading } = useQuery<SearchableItem[]>({
    queryKey: [itemType, searchTerm],
    queryFn: () => fetchOptions(searchTerm),
    enabled: isOpen,
  });

  // Separate query to fetch selected items data when field value changes
  const { data: selectedItemsData } = useQuery<SearchableItem[]>({
    queryKey: [itemType, 'selected', fieldValue],
    queryFn: async () => {
      const selectedIds: string[] = fieldValue || [];
      if (selectedIds.length === 0) return [];
      
      try {
        const allItems = await fetchOptions();
        return allItems.filter(item => selectedIds.includes(item._id));
      } catch (error) {
        console.error('Error fetching selected items:', error);
        return [];
      }
    },
    enabled: !!(fieldValue && fieldValue.length > 0),
  });

  const items = itemsData || [];
  const selectedItems = selectedItemsData || [];

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedIds: string[] = field.value || [];

        const selectedObjects = selectedIds
          .map((id) => selectedItems.find((i) => i?._id === id))
          .filter((item): item is SearchableItem => item !== undefined);

        const availableItems = items.filter((i) => !selectedIds.includes(i._id));

        const removeItem = (e: any, id: string) => {
          e.stopPropagation();
          field.onChange(selectedIds.filter((x) => x !== id));
        };

        const toggleItem = (id: string) => {
          const exists = selectedIds.includes(id);
          field.onChange(
            exists ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
          );
        };

        const getLabel = (item: SearchableItem) => {
          if (itemType === "product") {
            const product = item as Product;
            return `${product.name}`;
          }
          if (itemType === "variant") {
            const v = item as Variant;
            return `${v.product_name} – ${v.name}`;
          }
          if (itemType === "user") {
            return item.displayName || (item as User).name;
          }
          return (item as Category).name;
        };

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>

            <FormControl>
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={disabled}
                  >
                    <div className="flex flex-wrap gap-1">
                      {selectedObjects.length ? (
                        selectedObjects.map((item) => (
                          <span
                            key={item._id}
                            className="px-2 py-1 rounded bg-primary/10 text-primary flex items-center gap-1 text-xs"
                          >
                            {getLabel(item)}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={(e) => removeItem(e, item._id)}
                            />
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="p-0 w-full">
                  <div className="p-2">
                    <div className="flex gap-2 items-center border px-3 py-2 rounded">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      <Input
                        ref={inputRef}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={`Search ${itemType}s...`}
                        className="border-0 p-0 focus:ring-0"
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        Loading...
                      </div>
                    ) : availableItems.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground text-sm">
                        {searchTerm 
                          ? `No ${itemType}s found matching "${searchTerm}"`
                          : `No ${itemType}s available`}
                      </div>
                    ) : (
                      availableItems.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-accent flex flex-col"
                          onClick={() => toggleItem(item._id)}
                        >
                          <span className="font-medium">{getLabel(item)}</span>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </FormControl>

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
