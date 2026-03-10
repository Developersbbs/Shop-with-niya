"use client";

import React, { useState, useTransition, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";

import {
  FormSheetContent,
  FormSheetBody,
  FormSheetHeader,
  FormSheetFooter,
} from "@/components/shared/form/FormSheet";
import { FormSubmitButton } from "@/components/shared/form/FormSubmitButton";

import {
  FileSpreadsheet,
  X,
  Download,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImportProduct {
  // Identity
  name: string;
  sku: string;
  slug?: string;
  description?: string;
  // Type & Structure
  productType: "physical" | "digital";
  productStructure: "simple" | "variant";
  productNature: "normal" | "combo";
  // Status
  status: "selling" | "draft" | "archived" | "out_of_stock";
  published: boolean;
  // Category
  category?: string;
  subcategories?: string;
  // Pricing
  costPrice: number;
  salesPrice: number;
  taxPercentage: number;
  // Stock
  stock: number;
  minStock: number;
  // Physical
  weight?: number;
  color?: string;
  // Digital
  downloadFormat?: string;
  fileSize?: number;
  licenseType?: string;
  downloadLimit?: number;
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  seoCanonical?: string;
  seoRobots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  // Tags
  tags?: string;
  // Variant fields (for variant rows)
  variantName?: string;
  variantSku?: string;
  variantSlug?: string;
  variantCostPrice?: number;
  variantSalePrice?: number;
  variantStock?: number;
  variantMinStock?: number;
  variantStatus?: string;
  variantAttributes?: string;
}

interface RowResult {
  row: number;
  product: ImportProduct | null;
  errors: string[];
  status: "valid" | "invalid" | "uploaded" | "failed";
}

type Props = {
  children: React.ReactNode;
  onSuccess?: () => void;
  action: (
    products: ImportProduct[]
  ) => Promise<{ success?: boolean; error?: string }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const REQUIRED_COLS = ["productname", "sku"];

// Template matches the full export format
const TEMPLATE_HEADERS = [
  "Product Name", "SKU", "Slug", "Description",
  "Product Type", "Product Structure", "Product Nature",
  "Status", "Published",
  "Category", "Subcategories",
  "Cost Price", "Sale Price", "Tax %",
  "Stock", "Min Stock",
  "Weight", "Color",
  "File Path", "File Size (MB)", "Download Format", "License Type", "Download Limit",
  "SEO Title", "SEO Description", "SEO Keywords", "SEO Canonical", "SEO Robots",
  "OG Title", "OG Description", "OG Image",
  "Average Rating", "Total Ratings", "Total Reviews",
  "Tags",
  "Variant Name", "Variant SKU", "Variant Slug",
  "Variant Cost Price", "Variant Sale Price",
  "Variant Stock", "Variant Min Stock", "Variant Status", "Variant Published",
  "Variant Attributes",
  "Created At", "Updated At",
];

const TEMPLATE_SAMPLE = [
  "Sample T-Shirt", "TSHIRT-001", "sample-t-shirt", "A great t-shirt",
  "physical", "simple", "normal",
  "selling", "Yes",
  "Clothing", "T-Shirts",
  199.99, 299.99, 18,
  50, 5,
  0.5, "Blue",
  "", "", "", "", "",
  "Sample T-Shirt", "A great t-shirt for everyday wear", "tshirt,clothing", "", "index,follow",
  "Sample T-Shirt OG", "A great t-shirt", "",
  0, 0, 0,
  "summer,sale",
  "", "", "", "", "", "", "", "", "", "",
  "", "",
];

const VALID_STATUSES = ["selling", "draft", "archived", "out_of_stock"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/[\s_\-%.()]/g, "");
}

function mapHeaders(rawHeaders: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  rawHeaders.forEach((h, i) => {
    map[normalizeHeader(h)] = i;
  });
  return map;
}

function parseRow(
  raw: (string | number | null | undefined)[],
  headerMap: Record<string, number>,
  rowNum: number
): RowResult {
  const errors: string[] = [];
  const get = (col: string): string =>
    String(raw[headerMap[col]] ?? "").trim();
  const getNum = (col: string, fallback = 0): number => {
    const v = parseFloat(get(col));
    return isNaN(v) ? fallback : v;
  };
  const getBool = (col: string): boolean => {
    const v = get(col).toLowerCase();
    return v === "yes" || v === "true" || v === "1";
  };

  // Required fields
  REQUIRED_COLS.forEach((col) => {
    if (headerMap[col] === undefined || get(col) === "") {
      errors.push(`Missing required field: ${col}`);
    }
  });

  // Pricing — required only for simple products
  const structure = get("productstructure") || "simple";
  const isVariantRow = get("variantsku") !== "";

  let costPrice = 0;
  let salesPrice = 0;

  if (structure === "variant" && isVariantRow) {
    costPrice = getNum("variantcostprice");
    salesPrice = getNum("variantsaleprice");
  } else if (structure === "simple") {
    costPrice = getNum("costprice");
    salesPrice = getNum("saleprice");
    if (costPrice <= 0) errors.push("Cost Price is required for simple products");
    if (salesPrice <= 0) errors.push("Sale Price is required for simple products");
    if (salesPrice > 0 && costPrice > 0 && salesPrice <= costPrice) {
      errors.push("Sale Price must be greater than Cost Price");
    }
  }

  if (errors.length > 0) {
    return { row: rowNum, product: null, errors, status: "invalid" };
  }

  const statusRaw = get("status").toLowerCase();
  const status = VALID_STATUSES.includes(statusRaw)
    ? (statusRaw as ImportProduct["status"])
    : "draft";

  const productTypeRaw = get("producttype").toLowerCase();
  const productType: ImportProduct["productType"] =
    productTypeRaw === "digital" ? "digital" : "physical";

  const productStructureRaw = get("productstructure").toLowerCase();
  const productStructure: ImportProduct["productStructure"] =
    productStructureRaw === "variant" ? "variant" : "simple";

  const productNatureRaw = get("productnature").toLowerCase();
  const productNature: ImportProduct["productNature"] =
    productNatureRaw === "combo" ? "combo" : "normal";

  return {
    row: rowNum,
    product: {
      name: get("productname"),
      sku: get("sku").toUpperCase(),
      slug: get("slug") || undefined,
      description: get("description") || undefined,
      productType,
      productStructure,
      productNature,
      status,
      published: getBool("published"),
      category: get("category") || undefined,
      subcategories: get("subcategories") || undefined,
      costPrice,
      salesPrice,
      taxPercentage: getNum("tax"),
      stock: getNum("stock"),
      minStock: getNum("minstock"),
      weight: get("weight") ? getNum("weight") : undefined,
      color: get("color") || undefined,
      downloadFormat: get("downloadformat") || undefined,
      fileSize: get("filesizeMB") ? getNum("filesizeMB") : undefined,
      licenseType: get("licensetype") || undefined,
      downloadLimit: get("downloadlimit") ? getNum("downloadlimit") : undefined,
      seoTitle: get("seotitle") || undefined,
      seoDescription: get("seodescription") || undefined,
      seoKeywords: get("seokeywords") || undefined,
      seoCanonical: get("seocanonical") || undefined,
      seoRobots: get("seorobots") || undefined,
      ogTitle: get("ogtitle") || undefined,
      ogDescription: get("ogdescription") || undefined,
      ogImage: get("ogimage") || undefined,
      tags: get("tags") || undefined,
      variantName: get("variantname") || undefined,
      variantSku: get("variantsku") ? get("variantsku").toUpperCase() : undefined,
      variantSlug: get("variantslug") || undefined,
      variantCostPrice: get("variantcostprice") ? getNum("variantcostprice") : undefined,
      variantSalePrice: get("variantsaleprice") ? getNum("variantsaleprice") : undefined,
      variantStock: get("variantstock") ? getNum("variantstock") : undefined,
      variantMinStock: get("variantminstock") ? getNum("variantminstock") : undefined,
      variantStatus: get("variantstatus") || undefined,
      variantAttributes: get("variantattributes") || undefined,
    },
    errors: [],
    status: "valid",
  };
}

function parseFile(file: File): Promise<RowResult[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(
          ws,
          { header: 1, defval: "" }
        );

        if (rows.length < 2) {
          reject(new Error("File has no data rows."));
          return;
        }

        const rawHeaders = rows[0] as string[];
        const headerMap = mapHeaders(rawHeaders);

        const missing = REQUIRED_COLS.filter((c) => headerMap[c] === undefined);
        if (missing.length > 0) {
          const humanNames: Record<string, string> = {
            productname: "Product Name",
            sku: "SKU",
          };
          reject(
            new Error(
              `Missing required columns: ${missing.map((c) => humanNames[c] || c).join(", ")}`
            )
          );
          return;
        }

        const results: RowResult[] = rows
          .slice(1)
          .filter((row) => row.some((cell) => cell !== ""))
          .map((row, i) => parseRow(row as string[], headerMap, i + 2));

        resolve(results);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, TEMPLATE_SAMPLE]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Products");
  XLSX.writeFile(wb, "products_import_template.xlsx");
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RowResult["status"] }) {
  const styles: Record<RowResult["status"], string> = {
    valid: "bg-emerald-100 text-emerald-700",
    invalid: "bg-red-100 text-red-600",
    uploaded: "bg-blue-100 text-blue-700",
    failed: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductBulkImportSheet({ children, action, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<RowResult[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const valid = results.filter((r) => r.status === "valid");
  const invalid = results.filter((r) => r.status === "invalid");
  const uploaded = results.filter((r) => r.status === "uploaded");
  const failed = results.filter((r) => r.status === "failed");

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setResults([]);
    setParseError(null);
    setExpandedRow(null);
    try {
      const parsed = await parseFile(f);
      setResults(parsed);
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : "Failed to parse file.");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const reset = () => {
    setFile(null);
    setResults([]);
    setParseError(null);
    setExpandedRow(null);
    setShowErrorsOnly(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) reset();
    setIsSheetOpen(open);
  };

  const handleSubmit = () => {
    const toUpload = valid.filter((r) => r.product).map((r) => r.product!);
    if (!toUpload.length) return;

    startTransition(async () => {
      const result = await action(toUpload);
      if (result.error) {
        toast.error(result.error);
        setResults((prev) =>
          prev.map((r) =>
            r.status === "valid"
              ? { ...r, status: "failed" as const, errors: [result.error!] }
              : r
          )
        );
      } else {
        setResults((prev) =>
          prev.map((r) =>
            r.status === "valid" ? { ...r, status: "uploaded" as const } : r
          )
        );
        toast.success(`${toUpload.length} products imported successfully!`, { position: "top-center" });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        onSuccess?.();
        setTimeout(() => { setIsSheetOpen(false); reset(); }, 1200);
      }
    });
  };

  const displayRows = showErrorsOnly
    ? results.filter((r) => r.status === "invalid" || r.status === "failed")
    : results;

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      {children}
      <SheetContent className="w-[90%] max-w-5xl">
        <FormSheetContent>
          <FormSheetHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <SheetTitle>Import Products via CSV / Excel</SheetTitle>
                <SheetDescription>
                  Upload your exported CSV or a custom file. Download the template for the correct format.
                </SheetDescription>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <Download size={13} />
                Download Template
              </button>
            </div>
          </FormSheetHeader>

          <FormSheetBody>
            <div className="space-y-5">

              {/* Drop zone */}
              {!file ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                    isDragging ? "border-primary bg-primary/5" : "border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-white p-4 shadow">
                      <FileSpreadsheet size={28} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Drop your file here or click to browse</p>
                      <p className="mt-1 text-xs text-gray-400">Supports .csv, .xlsx, .xls — including exported CSVs</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={20} className="text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB &middot; {results.length} rows parsed
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={reset} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Parse error */}
              {parseError && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Could not parse file</p>
                    <p className="text-red-500 mt-0.5 text-xs">{parseError}</p>
                  </div>
                </div>
              )}

              {/* Stats */}
              {results.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total", count: results.length, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
                    { label: "Valid", count: valid.length, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                    { label: "Errors", count: invalid.length, color: "text-red-600", bg: "bg-red-50 border-red-200" },
                    { label: "Imported", count: uploaded.length, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.bg}`}>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview table */}
              {results.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                    <p className="text-xs font-semibold text-gray-500">{displayRows.length} rows shown</p>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs text-gray-500">Errors only</span>
                      <div
                        onClick={() => setShowErrorsOnly((v) => !v)}
                        className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${showErrorsOnly ? "bg-primary" : "bg-gray-200"}`}
                      >
                        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${showErrorsOnly ? "translate-x-4" : "translate-x-0.5"}`} />
                      </div>
                    </label>
                  </div>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-400">
                          <th className="px-3 py-2.5 font-semibold">Row</th>
                          <th className="px-3 py-2.5 font-semibold">Name</th>
                          <th className="px-3 py-2.5 font-semibold">SKU</th>
                          <th className="px-3 py-2.5 font-semibold">Type</th>
                          <th className="px-3 py-2.5 font-semibold">Structure</th>
                          <th className="px-3 py-2.5 font-semibold">Cost</th>
                          <th className="px-3 py-2.5 font-semibold">Sale</th>
                          <th className="px-3 py-2.5 font-semibold">Tax%</th>
                          <th className="px-3 py-2.5 font-semibold">Stock</th>
                          <th className="px-3 py-2.5 font-semibold">Category</th>
                          <th className="px-3 py-2.5 font-semibold">Status</th>
                          <th className="px-3 py-2.5 font-semibold">Valid</th>
                          <th className="px-3 py-2.5 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.slice(0, 100).map((r) => (
                          <React.Fragment key={r.row}>
                            <tr className={`border-t border-gray-100 transition-colors ${
                              r.status === "invalid" || r.status === "failed" ? "bg-red-50/50"
                              : r.status === "uploaded" ? "bg-emerald-50/30"
                              : "hover:bg-gray-50/60"
                            }`}>
                              <td className="px-3 py-2.5 font-mono text-gray-400">{r.row}</td>
                              <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[120px] truncate">
                                {r.product?.name ?? <span className="italic text-gray-300">—</span>}
                              </td>
                              <td className="px-3 py-2.5 font-mono text-gray-500">{r.product?.sku ?? "—"}</td>
                              <td className="px-3 py-2.5 text-gray-500">{r.product?.productType ?? "—"}</td>
                              <td className="px-3 py-2.5 text-gray-500">{r.product?.productStructure ?? "—"}</td>
                              <td className="px-3 py-2.5 text-gray-600">
                                {r.product?.costPrice != null ? `₹${r.product.costPrice}` : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-gray-600">
                                {r.product?.salesPrice != null ? `₹${r.product.salesPrice}` : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-gray-600">
                                {r.product?.taxPercentage != null ? `${r.product.taxPercentage}%` : "0%"}
                              </td>
                              <td className="px-3 py-2.5 text-gray-600">{r.product?.stock ?? "—"}</td>
                              <td className="px-3 py-2.5 text-gray-500 max-w-[90px] truncate">
                                {r.product?.category ?? "—"}
                              </td>
                              <td className="px-3 py-2.5 text-gray-500">{r.product?.status ?? "—"}</td>
                              <td className="px-3 py-2.5"><StatusBadge status={r.status} /></td>
                              <td className="px-3 py-2.5">
                                {r.errors.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedRow(expandedRow === r.row ? null : r.row)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    {expandedRow === r.row ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  </button>
                                )}
                              </td>
                            </tr>
                            {expandedRow === r.row && r.errors.length > 0 && (
                              <tr className="border-t border-red-100 bg-red-50">
                                <td colSpan={13} className="px-4 py-2">
                                  <div className="flex flex-wrap gap-2">
                                    {r.errors.map((e, i) => (
                                      <span key={i} className="flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-[11px] text-red-600">
                                        <AlertCircle size={11} />{e}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                    {displayRows.length > 100 && (
                      <p className="px-4 py-2 text-center text-xs text-gray-400">
                        Showing first 100 of {displayRows.length} rows
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(uploaded.length > 0 || failed.length > 0) && (
                <div className="flex items-center gap-4 text-xs">
                  {uploaded.length > 0 && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle size={13} />{uploaded.length} imported successfully
                    </span>
                  )}
                  {failed.length > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertCircle size={13} />{failed.length} failed
                    </span>
                  )}
                </div>
              )}
            </div>
          </FormSheetBody>

          <FormSheetFooter>
            <FormSubmitButton
              isPending={isPending}
              className="w-full"
              onClick={handleSubmit}
              disabled={valid.length === 0 || isPending}
            >
              {isPending ? "Importing…" : `Import ${valid.length} Product${valid.length !== 1 ? "s" : ""}`}
            </FormSubmitButton>
          </FormSheetFooter>
        </FormSheetContent>
      </SheetContent>
    </Sheet>
  );
}