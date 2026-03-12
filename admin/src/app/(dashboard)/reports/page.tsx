"use client"

import { useState, useEffect, useCallback } from "react"
import { addDays } from "date-fns"
import { DateRange } from "react-day-picker"
import { DatePickerWithRange } from "@/components/reports/DateRangeFilter"
import { SalesChart } from "@/components/reports/SalesChart"
import { OrderStatusChart } from "@/components/reports/OrderStatusChart"
import { TopProductsTable } from "@/components/reports/TopProductsTable"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

const getApiUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

export default function ReportsPage() {
    const [date, setDate] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    })

    const [salesData, setSalesData] = useState([]);
    const [orderStatusData, setOrderStatusData] = useState({});
    const [topProductsData, setTopProductsData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        if (!date?.from) return;

        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                startDate: date.from.toISOString(),
                ...(date.to && { endDate: date.to.toISOString() }),
            });

            const apiUrl = getApiUrl();
            console.log('Fetching reports from:', apiUrl);

            const [salesRes, ordersRes, productsRes] = await Promise.all([
                fetch(`${apiUrl}/reports/sales?${queryParams}`),
                fetch(`${apiUrl}/reports/orders?${queryParams}`),
                fetch(`${apiUrl}/reports/products/top?${queryParams}`)
            ]);

            if (!salesRes.ok || !ordersRes.ok || !productsRes.ok) {
                console.error("Fetch failed");
                console.error("Sales:", salesRes.status, await salesRes.text());
                console.error("Orders:", ordersRes.status, await ordersRes.text());
                console.error("Products:", productsRes.status, await productsRes.text());
                throw new Error("One or more report requests failed");
            }

            const salesJson = await salesRes.json();
            const ordersJson = await ordersRes.json();
            const productsJson = await productsRes.json();

            if (salesJson.success) setSalesData(salesJson.data);
            if (ordersJson.success) setOrderStatusData(ordersJson.data);
            if (productsJson.success) setTopProductsData(productsJson.data);

        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
                <div className="flex items-center space-x-2">
                    <DatePickerWithRange date={date} setDate={setDate} />
                    <Button onClick={fetchData} disabled={loading}>
                        {loading ? 'Loading...' : 'Refresh'}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="sales">Sales & Revenue</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Sales Trend</CardTitle>
                                <CardDescription>
                                    Daily sales performance for the selected period.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <SalesChart data={salesData} />
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Order Statuses</CardTitle>
                                <CardDescription>
                                    Distribution of order current statuses.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <OrderStatusChart data={orderStatusData} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="sales">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Sales Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SalesChart data={salesData} />
                            {/* Add more detailed sales tables/metrics here if needed later */}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="products">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Selling Products</CardTitle>
                            <CardDescription>
                                Highest revenue generating products.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TopProductsTable data={topProductsData} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
