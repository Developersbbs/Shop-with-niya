"use client";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  tableName: string; // The name of the table/resource (e.g., 'categories', 'products', 'customers')
  action?: (...args: unknown[]) => Promise<unknown>;
};

export function ExportDataButtons({ tableName }: Props) {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    const toastId = toast.loading(`Exporting ${tableName} as ${format.toUpperCase()}...`);

    try {
      // Build query params from current search params
      const params = new URLSearchParams();

      // Add all current search params to the export request
      searchParams.forEach((value, key) => {
        params.set(key, value);
      });

      // Make request to the backend export endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/${tableName}/export/${format}?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Export failed with status ${response.status}`);
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${tableName} exported successfully!`, { id: toastId });
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export ${tableName}. Please try again.`, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };


  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        className="h-12"
        disabled={isExporting}
        onClick={() => handleExport("csv")}
      >
        <FileSpreadsheet className="mr-2 size-4" />
        {isExporting ? "Exporting..." : "Export CSV"}
      </Button>

    </div>
  );
}
