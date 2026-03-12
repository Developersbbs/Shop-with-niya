"use client";

import { useState, useRef, useEffect } from "react";
import { Control, FieldValues, Path, useController } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FormMultipleImageInputProps<TFormData extends FieldValues> = {
  control: Control<TFormData>;
  name: Path<TFormData>;
  label: string;

  previewImages?: string[];
  maxImages?: number;
  acceptedTypes?: string;
};

// ✅ Helper to get displayable URL for existing images
const getDisplayUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
};

export default function FormMultipleImageInput<TFormData extends FieldValues>({
  control,
  name,
  label,

  previewImages = [],
  maxImages = Infinity,
  acceptedTypes = "image/jpeg,image/jpg,image/png,image/webp",
}: FormMultipleImageInputProps<TFormData>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const hasInitialized = useRef(false);

  const {
    field: { value, onChange },
  } = useController({ name, control });

  useEffect(() => {
    if (!hasInitialized.current && previewImages && previewImages.length > 0) {
      const currentValue: (string | File)[] = Array.isArray(value) ? value : [];
      const hasExistingUrls = currentValue.some((item) => typeof item === 'string');
      if (!hasExistingUrls) {
        // Store original URLs (not display URLs) so backend receives correct paths
        onChange([...previewImages, ...currentValue.filter((item) => item instanceof File)]);
      }
      hasInitialized.current = true;
    }
  }, [previewImages, value, onChange]);

  const currentImages: (string | File)[] = Array.isArray(value) ? value : [];
  const existingUrlImages = currentImages.filter((img): img is string => typeof img === 'string');
  const newFileImages = currentImages.filter((img): img is File => img instanceof File);
  const totalCount = currentImages.length;
  const remainingSlots = maxImages === Infinity ? Infinity : maxImages - newFileImages.length;
  const canAddMore = newFileImages.length < maxImages || maxImages === Infinity;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!acceptedTypes.includes(file.type)) return false;
      if (file.size > 3 * 1024 * 1024) return false;
      return true;
    });
    const filesToAdd = remainingSlots === Infinity
      ? validFiles
      : validFiles.slice(0, remainingSlots);

    if (filesToAdd.length > 0) {
      onChange([...existingUrlImages, ...newFileImages, ...filesToAdd]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
  };

  const removeExistingImage = (urlIndex: number) => {
    const updatedExisting = existingUrlImages.filter((_, i) => i !== urlIndex);
    onChange([...updatedExisting, ...newFileImages]);
  };

  const removeNewImage = (fileIndex: number) => {
    const updatedFiles = newFileImages.filter((_, i) => i !== fileIndex);
    onChange([...existingUrlImages, ...updatedFiles]);
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col md:flex-row md:gap-x-4 md:space-y-0">
          <FormLabel className="md:flex-shrink-0 md:w-1/4 md:mt-2 leading-snug">
            {label}
          </FormLabel>

          <div className="space-y-4 w-full">
            {canAddMore && (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium text-primary">Click to upload</span> or drag and drop
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WEBP up to 3MB each
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={acceptedTypes}
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            )}

            {totalCount > 0 && (
              <div className="space-y-2">
                {/* ✅ FIX: Guard against undefined counts */}
                <div className="text-sm text-muted-foreground">
                  {totalCount} image{totalCount !== 1 ? 's' : ''} total
                  ({existingUrlImages.length} existing, {newFileImages.length} new)
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/20">
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">

                    {/* ✅ FIX: Use getDisplayUrl() so relative paths render correctly */}
                    {existingUrlImages.map((imageUrl: string, index: number) => (
                      <div key={`existing-${index}`} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getDisplayUrl(imageUrl)}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-full object-cover"
                            // Replace the onError handler
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // Stop infinite loop — only set fallback once
                              if (!target.dataset.errored) {
                                target.dataset.errored = 'true';
                                target.style.display = 'none'; // just hide broken image instead
                              }
                            }}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center pb-1">
                          <span className="text-white text-xs font-medium">Current</span>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); removeExistingImage(index); }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}

                    {/* New uploaded File images */}
                    {newFileImages.map((file: File, index: number) => (
                      <div key={`new-${index}`} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border bg-muted border-primary/50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end justify-center pb-1">
                          <span className="text-white text-xs font-medium">New</span>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); removeNewImage(index); }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <FormControl>
              <input type="hidden" name={field.name} value="" />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}