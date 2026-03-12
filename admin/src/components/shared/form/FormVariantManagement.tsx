"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import { Control, FieldValues, Path, useController } from "react-hook-form";
import { Plus, Trash2, Settings, ChevronDown, ChevronUp, Upload, X, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import {
  ProductVariantAttribute,
  ProductVariantCombination,
  ProductVariantData,
  DEFAULT_VARIANT_ATTRIBUTES,
  VariantManager,
} from "@/types/variants";

type FormVariantManagementProps<TFormData extends FieldValues> = {
  control: Control<TFormData>;
  name: Path<TFormData>;
  label?: string;
  baseSKU: string;
  baseSlug?: string;
  productName?: string;
};

export default function FormVariantManagement<TFormData extends FieldValues>({
  control,
  name,
  label = "Product Variants",
  baseSKU,
  productName,
}: FormVariantManagementProps<TFormData>) {
  const [isOpen, setIsOpen] = useState(false);
  const [variantData, setVariantData] = useState<ProductVariantData>({
    attributes: DEFAULT_VARIANT_ATTRIBUTES.map(attr => ({
      ...attr,
      id: `attr-${attr.name.toLowerCase()}`,
    })),
    combinations: [],
    autoGenerateSKU: true,
    autoGenerateStock: true,
  });
  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>({});
  const [newAttributeName, setNewAttributeName] = useState("");

  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
  });

  const isInitializing = useRef(true);
  const lastFormUpdateRef = useRef<string>('');

  const transformedData = useMemo(() => ({
    attributes: variantData.attributes,
    combinations: variantData.combinations,
    selectedValues,
    autoGenerateSKU: variantData.autoGenerateSKU,
    autoGenerateStock: variantData.autoGenerateStock,
  }), [variantData.attributes, variantData.combinations, variantData.autoGenerateSKU, variantData.autoGenerateStock, selectedValues]);

  useEffect(() => {
    console.log('🔄 TRANSFORMED DATA FOR FORM:', {
      attributesCount: transformedData.attributes.length,
      combinationsCount: transformedData.combinations.length,
      firstComboAttributes: transformedData.combinations[0]?.attributes,
      firstCombo: transformedData.combinations[0]
    });
  }, [transformedData]);

  const getDefaultOptionsForAttribute = (attrName: string): string[] => {
    const normalizedName = attrName.toLowerCase();
    if (normalizedName === 'size') return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    if (normalizedName === 'color') return ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Purple', 'Orange'];
    if (normalizedName === 'material') return ['Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Leather', 'Denim'];
    return [];
  };

  // Initialize variant data from form value (ONLY ONCE)
  // Initialize variant data from form value (ONLY ONCE)
  useEffect(() => {
    if (isInitializing.current) {
      if (value && typeof value === 'object') {
        console.log('🔄 INITIALIZING variant data from form value:', value);

        const mappedCombinations = (value.combinations || []).map((combo: ProductVariantCombination & { cost_price?: number; selling_price?: number; sellingPrice?: number }) => ({
          ...combo,
          costPrice: combo.costPrice ?? combo.cost_price ?? 0,
          salesPrice: combo.salesPrice ?? combo.selling_price ?? combo.sellingPrice ?? 0,
          // ✅ FIX: Preserve existing image URLs from DB — keep them as strings in the images array
          images: combo.images || [],
        }));

        const mappedAttributes = value.attributes && value.attributes.length > 0
          ? value.attributes.map((attribute: ProductVariantAttribute) => {
            const defaultOptions = getDefaultOptionsForAttribute(attribute.name);
            return {
              ...attribute,
              id: attribute.id || `attr-${attribute.name.toLowerCase()}`,
              options: attribute.options || defaultOptions || [],
              type: attribute.type || 'select',
              required: attribute.required ?? false,
              allowCustom: attribute.allowCustom ?? true,
            };
          })
          : DEFAULT_VARIANT_ATTRIBUTES.map(attr => ({
            ...attr,
            id: `attr-${attr.name.toLowerCase()}`,
            type: attr.type,
            required: attr.required,
            allowCustom: attr.allowCustom,
          }));

        if (mappedCombinations.length > 0) {
          const allAttributeNames = new Set<string>();
          mappedCombinations.forEach((combo: ProductVariantCombination) => {
            if (combo.attributes) {
              Object.keys(combo.attributes).forEach(attrName => allAttributeNames.add(attrName));
            }
          });

          const finalAttributes = [...mappedAttributes];
          allAttributeNames.forEach(attrName => {
            const existingAttr = finalAttributes.find(attr => attr.name.toLowerCase() === attrName.toLowerCase());
            if (!existingAttr) {
              const defaultOptions = getDefaultOptionsForAttribute(attrName);
              finalAttributes.push({
                id: `attr-${attrName.toLowerCase()}`,
                name: attrName,
                type: 'select',
                required: false,
                allowCustom: true,
                options: defaultOptions.length > 0 ? defaultOptions : [attrName],
              });
            }
          });

          let initialSelectedValues: Record<string, string[]> = {};

          if (value.selectedValues && typeof value.selectedValues === 'object' && Object.keys(value.selectedValues).length > 0) {
            initialSelectedValues = value.selectedValues;
          } else {
            mappedCombinations.forEach((combo: ProductVariantCombination) => {
              if (combo.attributes) {
                Object.entries(combo.attributes).forEach(([key, val]: [string, string | number | boolean]) => {
                  const attrByName = finalAttributes.find((a: ProductVariantAttribute) =>
                    a.name?.toLowerCase() === key.toLowerCase()
                  );
                  if (attrByName && attrByName.id) {
                    const stringValue = typeof val === 'string' ? val : JSON.stringify(val);
                    if (!initialSelectedValues[attrByName.id]) {
                      initialSelectedValues[attrByName.id] = [];
                    }
                    if (!initialSelectedValues[attrByName.id].includes(stringValue)) {
                      initialSelectedValues[attrByName.id].push(stringValue);
                    }
                  }
                });
              }
            });
          }

          setVariantData({
            attributes: finalAttributes,
            combinations: mappedCombinations, // ✅ images are preserved inside each combo
            autoGenerateSKU: value.autoGenerateSKU ?? true,
            autoGenerateStock: value.autoGenerateStock ?? true,
          });

          setSelectedValues(initialSelectedValues);
        } else {
          setVariantData({
            attributes: mappedAttributes,
            combinations: [],
            autoGenerateSKU: value.autoGenerateSKU ?? true,
            autoGenerateStock: value.autoGenerateStock ?? true,
          });
          setSelectedValues({});
        }
      }
      isInitializing.current = false;
    }
  }, [value]);

  // Regenerate names for existing combinations that don't have them
  useEffect(() => {
    if (variantData.combinations.length > 0 && productName) {
      const combinationsNeedingNames = variantData.combinations.filter(combo => !combo.name);
      if (combinationsNeedingNames.length > 0) {
        const updatedCombinations = variantData.combinations.map(combo => {
          if (!combo.name) {
            const generatedName = VariantManager.generateVariantName(productName, combo);
            return { ...combo, name: generatedName };
          }
          return combo;
        });

        setVariantData(prev => ({ ...prev, combinations: updatedCombinations }));
      }
    }
  }, [productName, variantData.combinations]);

  // Stable callback to update form value
  const updateFormValue = useCallback((data: ProductVariantData) => {
    const dataSignature = JSON.stringify({
      combinationsCount: data.combinations.length,
      combinationIds: data.combinations.map((c: ProductVariantCombination) => c.id),
      attributesCount: data.attributes.length,
      attributeIds: data.attributes.map((a: ProductVariantAttribute) => a.id),
      combinationValues: data.combinations.map((c: ProductVariantCombination) => ({
        id: c.id,
        name: c.name,
        costPrice: c.costPrice,
        salesPrice: c.salesPrice,
        stock: c.stock,
        minStock: c.minStock,
        sku: c.sku,
        slug: c.slug,
        imagesCount: c.images?.length || 0,
        // ✅ FIX 1: Track actual image references so changes are detected
        imageRefs: (c.images || []).map((img: string | File) =>
          img instanceof File ? img.name + img.size : img
        ).join(','),
      })),
    });

    if (lastFormUpdateRef.current !== dataSignature) {
      console.log('🔄 FRONTEND: Updating form value with current variant data:', {
        combinationsCount: data.combinations.length,
        hasData: data.combinations.length > 0,
        firstCombo: data.combinations[0]
      });

      lastFormUpdateRef.current = dataSignature;
      onChange(data);
    }
  }, [onChange]);

  // Update form value when variant data changes
  useEffect(() => {
    if (isInitializing.current) return;

    if (variantData.combinations.length === 0 && Object.values(selectedValues).every(values => values.length === 0)) {
      return;
    }

    updateFormValue(transformedData);
  }, [transformedData, updateFormValue, variantData.combinations.length, selectedValues]);

  // Generate combinations when selected values change
  useEffect(() => {
    const validSelectedValues: Record<string, string[]> = {};
    Object.entries(selectedValues).forEach(([attrId, values]) => {
      if (values && values.length > 0) {
        validSelectedValues[attrId] = values;
      }
    });

    if (Object.keys(validSelectedValues).length > 0) {
      const combinations = VariantManager.generateCombinations(variantData.attributes, validSelectedValues);

      const preservedCombinations = variantData.combinations.filter(existingCombo => {
        const comboAttributes = existingCombo.attributes || {};
        return Object.entries(comboAttributes).every(([attrName, attrValue]) => {
          const attr = variantData.attributes.find(a => a.name.toLowerCase() === attrName.toLowerCase());
          if (!attr) return false;
          const selectedValuesForAttr = validSelectedValues[attr.id] || [];
          return selectedValuesForAttr.includes(String(attrValue));
        });
      });

      const newCombinations = combinations.map((combo) => {
        const existing = preservedCombinations.find(existing => {
          const existingAttrs = JSON.stringify(existing.attributes);
          const newAttrs = JSON.stringify(combo.attributes);
          return existingAttrs === newAttrs;
        });

        const generatedSKU = variantData.autoGenerateSKU ? VariantManager.generateSKU(baseSKU, combo) : combo.sku;
        const generatedName = VariantManager.generateVariantName(productName || "Product", combo);

        if (existing) {
          return {
            ...existing,
            ...combo,
            sku: variantData.autoGenerateSKU ? generatedSKU : existing.sku,
            name: existing.name || generatedName,
            costPrice: existing.costPrice ?? combo.costPrice,
            salesPrice: existing.salesPrice ?? combo.salesPrice,
            stock: existing.stock ?? combo.stock,
            minStock: existing.minStock ?? combo.minStock,
            // ✅ FIX 2: Always preserve existing images, never overwrite with empty
            images: (existing.images && existing.images.length > 0)
              ? existing.images
              : (combo.images || []),
          };
        }

        return {
          ...combo,
          sku: generatedSKU,
          name: generatedName,
          slug: VariantManager.generateVariantSlug(combo),
          costPrice: combo.costPrice,
          salesPrice: combo.salesPrice,
        };
      });

      // ✅ FIX 3: Include image count in comparison so image changes trigger update
      const combinationsStr = JSON.stringify(variantData.combinations.map(c => ({
        id: c.id,
        attrs: c.attributes,
        imgCount: c.images?.length || 0,
      })));
      const newCombinationsStr = JSON.stringify(newCombinations.map(c => ({
        id: c.id,
        attrs: c.attributes,
        imgCount: c.images?.length || 0,
      })));

      if (combinationsStr !== newCombinationsStr) {
        console.log('🔄 COMBINATION: Updating combinations, new count:', newCombinations.length);
        setVariantData(prev => ({ ...prev, combinations: newCombinations }));
      }
    } else {
      const hasExistingCombinations = variantData.combinations.length > 0;
      const hasUserSelectedValues = Object.values(selectedValues).some(values => values.length > 0);

      if (hasExistingCombinations && !hasUserSelectedValues) {
        console.log('🔄 COMBINATION: Preserving existing combinations during editing initialization');
      } else if (hasExistingCombinations) {
        console.log('🔄 COMBINATION: Clearing combinations - no selected values');
        setVariantData(prev => ({ ...prev, combinations: [] }));
      }
    }
  }, [selectedValues, variantData.attributes, variantData.combinations, variantData.autoGenerateSKU, baseSKU, productName]);

  // Regenerate slugs when product name or attributes change
  useEffect(() => {
    if (variantData.combinations.length > 0) {
      const updatedCombinations = variantData.combinations.map(combo => {
        const newSlug = VariantManager.generateVariantSlug(combo);
        const newName = VariantManager.generateVariantName(productName || "Product", combo);
        return {
          ...combo,
          slug: combo.slug || newSlug,
          name: combo.name || newName,
        };
      });

      const combinationsStr = JSON.stringify(variantData.combinations.map(c => ({ id: c.id, slug: c.slug, name: c.name })));
      const updatedCombinationsStr = JSON.stringify(updatedCombinations.map(c => ({ id: c.id, slug: c.slug, name: c.name })));

      if (combinationsStr !== updatedCombinationsStr) {
        setVariantData(prev => ({ ...prev, combinations: updatedCombinations }));
      }
    }
  }, [productName, variantData.combinations]);

  const addAttribute = () => {
    if (!newAttributeName.trim()) return;
    if (!VariantManager.validateAttributeName(newAttributeName, variantData.attributes)) {
      alert("Attribute name already exists!");
      return;
    }
    const newAttribute = VariantManager.createAttribute(newAttributeName, 'select');
    setVariantData(prev => ({ ...prev, attributes: [...prev.attributes, newAttribute] }));
    setNewAttributeName("");
  };

  const removeAttribute = (attributeId: string) => {
    setVariantData(prev => ({
      ...prev,
      attributes: prev.attributes.filter(attr => attr.id !== attributeId),
    }));
    setSelectedValues(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [attributeId]: _, ...rest } = prev;
      return rest;
    });
  };

  const updateAttributeValues = (attributeId: string, values: string[]) => {
    setSelectedValues(prev => ({ ...prev, [attributeId]: values }));
  };

  const addCustomValue = (attributeId: string, value: string) => {
    if (!value.trim()) return;
    const currentValues = selectedValues[attributeId] || [];
    if (!currentValues.includes(value)) {
      updateAttributeValues(attributeId, [...currentValues, value]);
    }
  };

  const updateCombination = (combinationId: string, updates: Partial<ProductVariantCombination>) => {
    console.log('🔄 UPDATING COMBINATION:', combinationId, updates);
    setVariantData(prev => {
      const updatedCombinations = prev.combinations.map(combo =>
        combo.id === combinationId ? { ...combo, ...updates } : combo
      );
      return { ...prev, combinations: updatedCombinations };
    });
  };

  const removeCombination = (combinationId: string) => {
    setVariantData(prev => ({
      ...prev,
      combinations: prev.combinations.filter(combo => combo.id !== combinationId),
    }));
  };

  return (
    <div className="space-y-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className={cn(
            "w-full justify-between h-9 text-sm transition-all flex items-center border rounded-md px-3 py-2",
            isOpen ? "border-primary" : "hover:bg-muted/50 border-border"
          )}
        >
          <span className="flex items-center gap-2">
            <Settings className="h-3 w-3" />
            <span className="truncate">{label}</span>
          </span>
          <div className="flex items-center gap-2">
            {variantData.combinations.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {variantData.combinations.length}
              </Badge>
            )}
            {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-3 mt-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Attributes</span>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Attribute name"
                    value={newAttributeName}
                    onChange={(e) => setNewAttributeName(e.target.value)}
                    className="w-32 h-8 text-sm"
                  />
                  <Button size="sm" className="h-8 px-2" onClick={addAttribute} type="button">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {variantData.attributes.map((attribute) => (
                <VariantAttributeEditor
                  key={attribute.id}
                  attribute={attribute}
                  selectedValues={selectedValues[attribute.id] || []}
                  onValuesChange={(values) => updateAttributeValues(attribute.id, values)}
                  onAddCustom={(value) => addCustomValue(attribute.id, value)}
                  onRemove={() => removeAttribute(attribute.id)}
                  onUpdateAttribute={(updates) => {
                    setVariantData(prev => ({
                      ...prev,
                      attributes: prev.attributes.map(attr =>
                        attr.id === attribute.id ? { ...attr, ...updates } : attr
                      ),
                    }));
                  }}
                />
              ))}
            </CardContent>
          </Card>

          {(variantData.combinations.length > 0 || Object.values(selectedValues).some(values => values.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Variant Combinations
                  {variantData.combinations.length > 0 && ` (${variantData.combinations.length})`}
                  {Object.values(selectedValues).some(values => values.length > 0) && variantData.combinations.length === 0 && " (Generating...)"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {variantData.combinations.map((combination) => (
                    <VariantCombinationEditor
                      key={combination.id}
                      combination={combination}
                      baseSKU={baseSKU}
                      productName={productName}
                      onUpdate={(updates) => updateCombination(combination.id, updates)}
                      onRemove={() => removeCombination(combination.id)}
                    />
                  ))}
                  {Object.values(selectedValues).some(values => values.length > 0) && variantData.combinations.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Generating combinations...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// Variant Attribute Editor Component
function VariantAttributeEditor({
  attribute,
  selectedValues,
  onValuesChange,
  onAddCustom,
  onRemove,
  onUpdateAttribute,
}: {
  attribute: ProductVariantAttribute;
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  onAddCustom: (value: string) => void;
  onRemove: () => void;
  onUpdateAttribute?: (updates: Partial<ProductVariantAttribute>) => void;
}) {
  const [customValue, setCustomValue] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onValuesChange([...selectedValues, value]);
    } else {
      onValuesChange(selectedValues.filter(v => v !== value));
    }
  };

  const handleAddCustom = () => {
    if (customValue.trim()) {
      onAddCustom(customValue.trim());
      setCustomValue("");
    }
  };

  const handleAddOption = () => {
    if (newOptionValue.trim() && onUpdateAttribute) {
      const currentOptions = attribute.options || [];
      if (!currentOptions.includes(newOptionValue.trim())) {
        onUpdateAttribute({ options: [...currentOptions, newOptionValue.trim()] });
        setNewOptionValue("");
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="font-medium">{attribute.name}</Label>
          <Badge variant="outline" className="text-xs">{attribute.type}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} type="button">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {attribute.options && attribute.options.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {attribute.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${attribute.id}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => handleCheckboxChange(option, !!checked)}
                />
                <Label
                  htmlFor={`${attribute.id}-${option}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </div>
        )}

        {(attribute.type === 'select' || attribute.type === 'multiselect') && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder={`Add ${attribute.name.toLowerCase()} option`}
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
              />
              <Button size="sm" onClick={handleAddOption} type="button">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {attribute.allowCustom && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder={`Add custom ${attribute.name.toLowerCase()} selection`}
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustom()}
              />
              <Button size="sm" variant="outline" onClick={handleAddCustom} type="button">
                Add Selected
              </Button>
            </div>
          </div>
        )}

        {selectedValues && selectedValues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {selectedValues.map((value) => (
              <Badge key={value} variant="secondary" className="text-xs">
                {value}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0"
                  onClick={() => handleCheckboxChange(value, false)}
                  type="button"
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Variant Combination Editor Component
function VariantCombinationEditor({
  combination,
  baseSKU,
  productName,
  onUpdate,
  onRemove,
}: {
  combination: ProductVariantCombination;
  baseSKU: string;
  productName?: string;
  onUpdate: (updates: Partial<ProductVariantCombination>) => void;
  onRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const variantImages = useMemo(() => combination.images || [], [combination.images]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    const updatedImages = [...variantImages, ...newFiles];
    onUpdate({ images: updatedImages });
  }, [variantImages, onUpdate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (newFiles.length === 0) return;
    const updatedImages = [...variantImages, ...newFiles];
    onUpdate({ images: updatedImages });
  }, [variantImages, onUpdate]);

  const removeImage = useCallback((index: number) => {
    const updatedImages = variantImages.filter((_, i) => i !== index);
    const removedImage = variantImages[index];
    if (removedImage && typeof removedImage === 'string' && removedImage.startsWith('blob:')) {
      URL.revokeObjectURL(removedImage);
    }
    onUpdate({ images: updatedImages });
  }, [variantImages, onUpdate]);

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Label className="font-medium">Variant</Label>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {combination.name || combination.slug || 'Unnamed Variant'}
              </Badge>
              {!combination.published && (
                <Badge variant="secondary" className="text-xs">Draft</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdate({ published: !combination.published })}
              type="button"
              className={cn(
                "h-8 px-2",
                combination.published
                  ? "text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                  : "text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100"
              )}
            >
              {combination.published ? (
                <><Eye className="h-3 w-3 mr-1" />Published</>
              ) : (
                <><EyeOff className="h-3 w-3 mr-1" />Draft</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              type="button"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor={`name-${combination.id}`} className="text-sm">Variant Name</Label>
              <div className="relative">
                <Input
                  id={`name-${combination.id}`}
                  value={combination.name || ''}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="Auto-generated from product + variant"
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newName = VariantManager.generateVariantName(productName || "Product", combination);
                    onUpdate({ name: newName });
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor={`sku-${combination.id}`} className="text-sm">SKU *</Label>
              <div className="relative">
                <Input
                  id={`sku-${combination.id}`}
                  value={combination.sku}
                  onChange={(e) => onUpdate({ sku: e.target.value.toUpperCase() })}
                  placeholder="Auto-generated or custom"
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newSKU = VariantManager.generateSKU(baseSKU, combination);
                    onUpdate({ sku: newSKU });
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor={`slug-${combination.id}`} className="text-sm">Variant Slug *</Label>
              <div className="relative">
                <Input
                  id={`slug-${combination.id}`}
                  value={combination.slug || ''}
                  onChange={(e) => onUpdate({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="Auto-generated from variant attributes"
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newSlug = VariantManager.generateVariantSlug(combination);
                    onUpdate({ slug: newSlug });
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor={`costPrice-${combination.id}`} className="text-sm">Cost Price *</Label>
              <div className="relative">
                <div className="absolute top-0 left-0 border-r border-r-input px-3 h-10 w-10 grid place-items-center text-lg rounded-l-md">
                  <span>₹</span>
                </div>
                <Input
                  id={`costPrice-${combination.id}`}
                  type="number"
                  step="1"
                  min="0"
                  className="h-10 pl-14"
                  value={combination.costPrice ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === '' ? undefined : parseFloat(value) || 0;
                    onUpdate({ costPrice: numValue });
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`salesPrice-${combination.id}`} className="text-sm">Sales Price *</Label>
              <div className="relative">
                <div className="absolute top-0 left-0 border-r border-r-input px-3 h-10 w-10 grid place-items-center text-lg rounded-l-md">
                  <span>₹</span>
                </div>
                <Input
                  id={`salesPrice-${combination.id}`}
                  type="number"
                  step="1"
                  min="0"
                  className="h-10 pl-14"
                  value={combination.salesPrice ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = value === '' ? undefined : parseFloat(value) || 0;
                    onUpdate({ salesPrice: numValue });
                  }}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`stock-${combination.id}`} className="text-sm">Stock Quantity</Label>
              <Input
                id={`stock-${combination.id}`}
                type="number"
                min="0"
                value={combination.stock ?? ''}
                onChange={(e) => onUpdate({ stock: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor={`minStock-${combination.id}`} className="text-sm">Min Stock Alert</Label>
              <Input
                id={`minStock-${combination.id}`}
                type="number"
                min="0"
                value={combination.minStock ?? ''}
                onChange={(e) => onUpdate({ minStock: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Variant Images</Label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />

            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Drag and drop images here</p>
                  <p>or click to browse files</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, WebP (Max 5MB each)
                </p>
              </div>
            </div>

            {variantImages.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {variantImages.length} image{variantImages.length !== 1 ? 's' : ''} uploaded
                </div>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-3 bg-muted/20">
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {variantImages.map((img, index) => {
                      const imageSrc = img instanceof File ? URL.createObjectURL(img) : img;
                      const imageAlt = img instanceof File ? img.name : `Variant ${index + 1}`;
                      return (
                        <div key={index} className="relative group aspect-square">
                          <Image
                            src={imageSrc}
                            alt={imageAlt}
                            width={100}
                            height={100}
                            unoptimized
                            className="w-full h-full object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}