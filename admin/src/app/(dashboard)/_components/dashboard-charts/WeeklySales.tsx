"use client";

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useTheme } from "next-themes";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Typography from "@/components/ui/typography";
import { getPastDates } from "@/helpers/getPastDates";
import useGetMountStatus from "@/hooks/use-get-mount-status";

interface WeeklyData {
  date: string;
  sales: number;
  orders: number;
}

export default function WeeklySales() {
  const labels = getPastDates(7);
  const { theme } = useTheme();
  const mounted = useGetMountStatus();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/weekly-data`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.success) {
          setWeeklyData(result.data);
        } else {
          console.error('Failed to fetch weekly data:', result.error);
        }
      } catch (error) {
        console.error('Error fetching weekly data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, []);

  const gridColor = `rgba(161, 161, 170, ${theme === "light" ? "0.5" : "0.3"})`;

  // Extract sales and orders data from weeklyData
  const salesData = weeklyData.map(item => item.sales);
  const ordersData = weeklyData.map(item => item.orders);

  return (
    <Card>
      <Typography variant="h3" className="mb-4">
        Weekly Sales
      </Typography>

      <CardContent className="pb-2">
        <Tabs defaultValue="sales">
          <TabsList className="mb-6">
            <TabsTrigger
              value="sales"
              className="data-[state=active]:text-primary"
            >
              Sales
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="data-[state=active]:text-orange-500"
            >
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="relative h-60">
            {mounted ? (
              <Line
                data={{
                  labels,
                  datasets: [
                    {
                      label: "Sales",
                      data: [400, 300, 100, 250, 200, 300, 1000],
                      borderColor: "rgb(34, 197, 94)",
                      backgroundColor: "rgb(34, 197, 94)",
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      grid: {
                        color: gridColor,
                      },
                      border: {
                        color: gridColor,
                      },
                      ticks: {
                        stepSize: 200,
                        callback: function (value) {
                          return "₹" + value;
                        },
                        padding: 4,
                      },
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) =>
                          `${context.dataset.label}: $${context.parsed.y}`,
                      },
                    },
                  },
                }}
              />
            ) : (
              <Skeleton className="size-full" />
            )}
          </TabsContent>

          <TabsContent value="orders" className="relative h-60">
            {mounted ? (
              <Line
                data={{
                  labels,
                  datasets: [
                    {
                      label: "Orders",
                      data: [3, 3, 1, 4, 1, 1, 2],
                      borderColor: "rgb(249, 115, 22)",
                      backgroundColor: "rgb(249, 115, 22)",
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      grid: {
                        color: gridColor,
                      },
                      border: {
                        color: gridColor,
                      },
                      ticks: {
                        stepSize: 1,
                        padding: 4,
                      },
                      min: 0,
                    },
                    x: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                }}
              />
            ) : (
              <Skeleton className="size-full" />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
