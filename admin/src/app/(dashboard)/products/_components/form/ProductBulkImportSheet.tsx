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
  name: string;
  description?: string;
  sku: string;
  costPrice: number;
  salesPrice: number;
  stock: number;
  category: string;
  tags?: string;
  status: "selling" | "draft" | "archived" | "out_of_stock";
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

// ✅ FIX: Required cols use normalized keys (lowercase, no spaces/underscores).
// "Product Name" → "productname", "Sale Price" → "saleprice", etc.
// This matches BOTH the exported CSV format AND manual upload templates.
const REQUIRED_COLS = [
  "productname",
  "sku",
  "costprice",
  "saleprice",
  "stock",
];

const TEMPLATE_HEADERS = [
  "Product Name",
  "Description",
  "SKU",
  "Product Type",
  "Structure",
  "Status",
  "Published",
  "Category",
  "Cost Price",
  "Sale Price",
  "Tax %",
  "Stock",
  "Min Stock",
  "Tags",
  "Created At",
];

const TEMPLATE_SAMPLE = [
  "Sample Product",
  "A great product description",
  "SKU-001",
  "physical",
  "simple",
  "selling",
  "Yes",
  "Electronics",
  199.99,
  299.99,
  0,
  50,
  5,
  "new,sale",
  "",
];

const VALID_STATUSES = ["selling", "draft", "archived", "out_of_stock"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/[\s_\-%.]/g, "");
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

  // Check required columns
  REQUIRED_COLS.forEach((col) => {
    if (headerMap[col] === undefined || get(col) === "") {
      errors.push(`Missing required field: ${col}`);
    }
  });

  const costPrice = parseFloat(get("costprice"));
  if (isNaN(costPrice) || costPrice < 0) errors.push("Invalid costPrice");

  // ✅ FIX: use "saleprice" (matches "Sale Price" normalized) instead of "salesprice"
  const salesPrice = parseFloat(get("saleprice"));
  if (isNaN(salesPrice) || salesPrice < 0) errors.push("Invalid salesPrice");

  if (!isNaN(costPrice) && !isNaN(salesPrice) && salesPrice <= costPrice) {
    errors.push("salesPrice must be greater than costPrice");
  }

  const stock = parseInt(get("stock"), 10);
  if (isNaN(stock) || stock < 0) errors.push("Invalid stock");

  const statusRaw = get("status").toLowerCase();
  const status = VALID_STATUSES.includes(statusRaw)
    ? (statusRaw as ImportProduct["status"])
    : "draft";

  // ✅ Category is optional for exported CSV rows (variants may have no category)
  const category = get("category") || "";

  if (errors.length > 0) {
    return { row: rowNum, product: null, errors, status: "invalid" };
  }

  return {
    row: rowNum,
    product: {
      name: get("productname"),
      description: get("description") || undefined,
      sku: get("sku").toUpperCase(),
      costPrice,
      salesPrice,
      stock,
      category,
      tags: get("tags") || undefined,
      status,
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

        // ✅ FIX: Check against normalized required cols
        const missing = REQUIRED_COLS.filter(
          (c) => headerMap[c] === undefined
        );
        if (missing.length > 0) {
          // Show human-readable names in error message
          const humanNames: Record<string, string> = {
            productname: "Product Name",
            sku: "SKU",
            costprice: "Cost Price",
            saleprice: "Sale Price",
            stock: "Stock",
          };
          reject(
            new Error(
              `Missing required columns: ${missing
                .map((c) => humanNames[c] || c)
                .join(", ")}`
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
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductBulkImportSheet({
  children,
  action,
  onSuccess,
}: Props) {
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

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setResults([]);
    setParseError(null);
    setExpandedRow(null);
    try {
      const parsed = await parseFile(f);
      setResults(parsed);
    } catch (err: unknown) {
      setParseError(
        err instanceof Error ? err.message : "Failed to parse file."
      );
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

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

  // ── Submit ─────────────────────────────────────────────────────────────────

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
        toast.success(`${toUpload.length} products imported successfully!`, {
          position: "top-center",
        });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        onSuccess?.();
        setTimeout(() => {
          setIsSheetOpen(false);
          reset();
        }, 1200);
      }
    });
  };

  const displayRows = showErrorsOnly
    ? results.filter((r) => r.status === "invalid" || r.status === "failed")
    : results;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
      {children}

      <SheetContent className="w-[90%] max-w-5xl">
        <FormSheetContent>

          {/* ── Header ── */}
          <FormSheetHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <SheetTitle>Import Products via CSV / Excel</SheetTitle>
                <SheetDescription>
                  Upload a .csv or .xlsx file to bulk-add products. You can also use your exported CSV directly.
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

          {/* ── Body ── */}
          <FormSheetBody>
            <div className="space-y-5">

              {/* Drop zone */}
              {!file ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all
                    ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 bg-gray-50 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFile(e.target.files[0])
                    }
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-white p-4 shadow">
                      <FileSpreadsheet size={28} className="text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Drop your file here or click to browse
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Supports .csv, .xlsx, .xls — including exported CSVs
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* File info bar */
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={20} className="text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB &middot;{" "}
                        {results.length} rows parsed
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
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

              {/* Stats bar */}
              {results.length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: "Total",
                      count: results.length,
                      color: "text-gray-700",
                      bg: "bg-gray-50 border-gray-200",
                    },
                    {
                      label: "Valid",
                      count: valid.length,
                      color: "text-emerald-700",
                      bg: "bg-emerald-50 border-emerald-200",
                    },
                    {
                      label: "Errors",
                      count: invalid.length,
                      color: "text-red-600",
                      bg: "bg-red-50 border-red-200",
                    },
                    {
                      label: "Imported",
                      count: uploaded.length,
                      color: "text-blue-600",
                      bg: "bg-blue-50 border-blue-200",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`rounded-xl border px-4 py-3 ${s.bg}`}
                    >
                      <p className={`text-2xl font-bold ${s.color}`}>
                        {s.count}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview table */}
              {results.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  {/* Table toolbar */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
                    <p className="text-xs font-semibold text-gray-500">
                      {displayRows.length} rows shown
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs text-gray-500">Errors only</span>
                      <div
                        onClick={() => setShowErrorsOnly((v) => !v)}
                        className={`relative h-5 w-9 rounded-full transition-colors cursor-pointer ${
                          showErrorsOnly ? "bg-primary" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            showErrorsOnly ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </label>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-400">
                          <th className="px-4 py-2.5 font-semibold">Row</th>
                          <th className="px-4 py-2.5 font-semibold">Name</th>
                          <th className="px-4 py-2.5 font-semibold">SKU</th>
                          <th className="px-4 py-2.5 font-semibold">Cost</th>
                          <th className="px-4 py-2.5 font-semibold">Sales</th>
                          <th className="px-4 py-2.5 font-semibold">Stock</th>
                          <th className="px-4 py-2.5 font-semibold">Category</th>
                          <th className="px-4 py-2.5 font-semibold">Status</th>
                          <th className="px-4 py-2.5 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRows.slice(0, 100).map((r) => (
                          <React.Fragment key={r.row}>
                            <tr
                              className={`border-t border-gray-100 transition-colors ${
                                r.status === "invalid" || r.status === "failed"
                                  ? "bg-red-50/50"
                                  : r.status === "uploaded"
                                  ? "bg-emerald-50/30"
                                  : "hover:bg-gray-50/60"
                              }`}
                            >
                              <td className="px-4 py-2.5 font-mono text-gray-400">
                                {r.row}
                              </td>
                              <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[130px] truncate">
                                {r.product?.name ?? (
                                  <span className="italic text-gray-300">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-gray-500">
                                {r.product?.sku ?? "—"}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">
                                {r.product?.costPrice != null
                                  ? `$${r.product.costPrice.toFixed(2)}`
                                  : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">
                                {r.product?.salesPrice != null
                                  ? `$${r.product.salesPrice.toFixed(2)}`
                                  : "—"}
                              </td>
                              <td className="px-4 py-2.5 text-gray-600">
                                {r.product?.stock ?? "—"}
                              </td>
                              <td className="px-4 py-2.5 text-gray-500 max-w-[100px] truncate">
                                {r.product?.category ?? "—"}
                              </td>
                              <td className="px-4 py-2.5">
                                <StatusBadge status={r.status} />
                              </td>
                              <td className="px-4 py-2.5">
                                {r.errors.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedRow(
                                        expandedRow === r.row ? null : r.row
                                      )
                                    }
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    {expandedRow === r.row ? (
                                      <ChevronUp size={14} />
                                    ) : (
                                      <ChevronDown size={14} />
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>

                            {/* Error detail row */}
                            {expandedRow === r.row && r.errors.length > 0 && (
                              <tr className="border-t border-red-100 bg-red-50">
                                <td colSpan={9} className="px-4 py-2">
                                  <div className="flex flex-wrap gap-2">
                                    {r.errors.map((e, i) => (
                                      <span
                                        key={i}
                                        className="flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-[11px] text-red-600"
                                      >
                                        <AlertCircle size={11} />
                                        {e}
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

              {/* Upload result feedback */}
              {(uploaded.length > 0 || failed.length > 0) && (
                <div className="flex items-center gap-4 text-xs">
                  {uploaded.length > 0 && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle size={13} />
                      {uploaded.length} imported successfully
                    </span>
                  )}
                  {failed.length > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertCircle size={13} />
                      {failed.length} failed
                    </span>
                  )}
                </div>
              )}
            </div>
          </FormSheetBody>

          {/* ── Footer ── */}
          <FormSheetFooter>
            <FormSubmitButton
              isPending={isPending}
              className="w-full"
              onClick={handleSubmit}
              disabled={valid.length === 0 || isPending}
            >
              {isPending
                ? "Importing…"
                : `Import ${valid.length} Product${valid.length !== 1 ? "s" : ""}`}
            </FormSubmitButton>
          </FormSheetFooter>

        </FormSheetContent>
      </SheetContent>
    </Sheet>
  );
}