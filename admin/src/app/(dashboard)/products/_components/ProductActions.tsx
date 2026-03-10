"use client";

import { PenSquare, Trash2, Plus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SheetTrigger } from "@/components/ui/sheet";
import { ActionAlertDialog } from "@/components/shared/ActionAlertDialog";
import { ExportDataButtons } from "@/components/shared/ExportDataButtons";

import ProductFormSheet from "./form/ProductFormSheet";
import ProductBulkActionSheet from "./form/ProductBulkActionSheet";
import ProductBulkImportSheet from "./form/ProductBulkImportSheet";
import { addProduct } from "@/actions/products/addProduct";
import { editProducts } from "@/actions/products/editProducts";
import { deleteProducts } from "@/actions/products/deleteProducts";
import { exportProducts } from "@/actions/products/exportProducts";
import { importProducts } from "@/actions/products/importProducts";
import { RowSelectionProps } from "@/types/data-table";
import { useAuthorization } from "@/hooks/use-authorization";

export default function ProductActions({
  rowSelection,
  setRowSelection,
  products = [],
}: RowSelectionProps & { products?: any[] }) {
  const { hasPermission } = useAuthorization();

  const getSelectedProductIds = () => {
    const selectedRowIds = Object.entries(rowSelection)
      .filter(([_, isSelected]) => isSelected)
      .map(([rowId]) => rowId);

    const ids = selectedRowIds.map((rowId) => {
      const simpleProduct = products.find(
        (p) => (p._id?.toString() || p.id?.toString()) === rowId && (!p.product_variants || p.product_variants.length === 0)
      );
      if (simpleProduct) return simpleProduct._id || simpleProduct.id;

      const parentProduct = products.find((p) =>
        p.product_variants?.some(
          (v: any) => v._id?.toString() === rowId
        )
      );
      if (parentProduct) return parentProduct._id || parentProduct.id;

      return rowId;
    });

    return [...new Set(ids)].filter(Boolean);
  };

  return (
    <Card className="mb-5">
      <div className="flex flex-col xl:flex-row xl:justify-between gap-4">

        {/* ✅ Left side: Export CSV + Import CSV together */}
        <div className="flex flex-col sm:flex-row gap-4">
          <ExportDataButtons action={exportProducts} tableName="products" />

          {hasPermission("products", "canCreate") && (
            <ProductBulkImportSheet action={importProducts}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  type="button"
                  className="sm:flex-grow xl:flex-grow-0"
                >
                  <Upload className="mr-2 size-4" /> Import CSV
                </Button>
              </SheetTrigger>
            </ProductBulkImportSheet>
          )}
        </div>

        {/* Right side: Bulk Action + Delete + Add Product */}
        {(hasPermission("products", "canEdit") ||
          hasPermission("products", "canDelete") ||
          hasPermission("products", "canCreate")) && (
          <div className="flex flex-col sm:flex-row gap-4">

            {/* Bulk Edit */}
            {hasPermission("products", "canEdit") && (
              <ProductBulkActionSheet
                action={(formData) =>
                  editProducts(getSelectedProductIds(), formData)
                }
                onSuccess={() => setRowSelection({})}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="secondary"
                    size="lg"
                    type="button"
                    disabled={!Boolean(Object.keys(rowSelection).length)}
                    className="sm:flex-grow xl:flex-grow-0 transition-opacity duration-300"
                  >
                    <PenSquare className="mr-2 size-4" /> Bulk Action
                  </Button>
                </SheetTrigger>
              </ProductBulkActionSheet>
            )}

            {/* Delete */}
            {hasPermission("products", "canDelete") && (
              <ActionAlertDialog
                title={`Delete ${Object.keys(rowSelection).length} products?`}
                description="This action cannot be undone. This will permanently delete the products and their associated data from the database."
                actionButtonText="Delete Products"
                toastSuccessMessage="Products deleted successfully"
                queryKey="products"
                action={() => deleteProducts(getSelectedProductIds())}
                onSuccess={() => setRowSelection({})}
              >
                <Button
                  variant="destructive"
                  size="lg"
                  type="button"
                  disabled={!Boolean(Object.keys(rowSelection).length)}
                  className="sm:flex-grow xl:flex-grow-0 transition-opacity duration-300"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </Button>
              </ActionAlertDialog>
            )}

            {/* Add Product */}
            {hasPermission("products", "canCreate") && (
              <ProductFormSheet
                title="Add Product"
                description="Add necessary product information here"
                submitButtonText="Add Product"
                actionVerb="added"
                action={addProduct}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="default"
                    size="lg"
                    className="sm:flex-grow xl:flex-grow-0"
                  >
                    <Plus className="mr-2 size-4" /> Add Product
                  </Button>
                </SheetTrigger>
              </ProductFormSheet>
            )}

          </div>
        )}
      </div>
    </Card>
  );
}