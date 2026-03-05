import React from "react";
import { useFieldArray, Control, UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormTextInput } from "@/components/shared/form";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { CategoryFormData } from "./schema";

type SubcategoryListProps = {
  control: Control<CategoryFormData>;
  form?: UseFormReturn<CategoryFormData>;
};

function generateSimpleSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function SubcategoryList({ control, form }: SubcategoryListProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "subcategories",
  });

  // ✅ REMOVED the buggy useEffect that was re-appending subcategories
  // react-hook-form's useFieldArray already handles initialData correctly
  // The useEffect was causing deleted subcategories to reappear

  const addSubcategory = () => {
    append({
      name: "",
      description: "",
      slug: "",
      published: true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Subcategories</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSubcategory}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Subcategory
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="relative space-y-4 rounded-lg border p-4"
          >
            {/* Header with action buttons */}
            <div className="flex justify-end mb-2">
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={addSubcategory}
                  title="Add subcategory"
                >
                  <Plus className="h-4 w-4" />
                </Button>

                {/* ✅ Always allow delete — no disabled state needed */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  title="Delete subcategory"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <FormTextInput
                control={control}
                name={`subcategories.${index}.name`}
                label="Name"
                placeholder="Subcategory Name"
              />

              <FormTextInput
                control={control}
                name={`subcategories.${index}.description`}
                label="Description"
                placeholder="Subcategory Description"
              />

              <FormField
                control={control}
                name={`subcategories.${index}.slug`}
                render={({ field }) => (
                  <FormItem className="flex flex-col md:flex-row md:gap-x-4 md:space-y-0">
                    <FormLabel className="md:flex-shrink-0 md:w-1/4 md:mt-2 leading-snug">
                      Slug
                    </FormLabel>

                    <div className="space-y-2 w-full">
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            className="h-12 pr-[6.75rem] sm:pr-32"
                            placeholder="subcategory-slug"
                            {...field}
                          />

                          <Button
                            type="button"
                            variant="secondary"
                            className="absolute top-0 right-0 border border-input px-6 h-12 w-24 sm:w-28 grid place-items-center rounded-none rounded-r-md flex-shrink-0"
                            onClick={() => {
                              if (form) {
                                const sourceValue = form.getValues(`subcategories.${index}.name`);
                                if (sourceValue && typeof sourceValue === "string") {
                                  const generatedSlug = generateSimpleSlug(sourceValue);
                                  form.setValue(`subcategories.${index}.slug`, generatedSlug, {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  });
                                }
                              }
                            }}
                          >
                            Generate
                          </Button>
                        </div>
                      </FormControl>

                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`subcategories.${index}.published`}
                render={({ field }) => (
                  <FormItem className="flex flex-col md:flex-row md:gap-x-4 md:space-y-0">
                    <FormLabel className="md:flex-shrink-0 md:w-1/4 md:mt-2 leading-snug">
                      Published
                    </FormLabel>

                    <div className="space-y-2 w-full">
                      <FormControl>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`published-${index}`}
                            checked={field.value ?? true}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`published-${index}`}
                            className="text-sm font-medium text-gray-700 cursor-pointer"
                          >
                            Make this subcategory active
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}

        {/* ✅ Show empty state if no subcategories */}
        {fields.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
            <p className="text-sm">No subcategories yet.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={addSubcategory}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Subcategory
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SubcategoryList;