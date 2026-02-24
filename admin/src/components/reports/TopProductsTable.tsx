"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface ProductData {
    productId: string;
    name: string;
    totalQuantity: number;
    totalRevenue: number;
}

interface TopProductsTableProps {
    data: ProductData[];
}

export function TopProductsTable({ data }: TopProductsTableProps) {
    return (
        <div className="rounded-md border bg-white shadow">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="text-right">Quantity Sold</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">
                                No data available
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((product, index) => (
                            <TableRow key={`${product.productId}-${index}`}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-right">{product.totalQuantity}</TableCell>
                                <TableCell className="text-right">${product.totalRevenue.toFixed(2)}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
