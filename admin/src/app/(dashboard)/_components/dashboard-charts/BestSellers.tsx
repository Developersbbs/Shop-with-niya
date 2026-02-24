"use client";

import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { useTheme } from "next-themes";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Typography from "@/components/ui/typography";
import useGetMountStatus from "@/hooks/use-get-mount-status";

interface BestSeller {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export default function BestSellers() {
  const mounted = useGetMountStatus();
  const { theme } = useTheme();
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/best-sellers`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.success) {
          setBestSellers(result.data);
        } else {
          console.error('Failed to fetch best sellers:', result.error);
        }
      } catch (error) {
        console.error('Error fetching best sellers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  // Extract data for chart
  const labels = bestSellers.map(item => item.productName);
  const data = bestSellers.map(item => item.totalQuantity);
  
  // Generate colors for the chart
  const backgroundColor = [
    "rgb(34, 197, 94)",
    "rgb(59, 130, 246)", 
    "rgb(249, 115, 22)",
    "rgb(99, 102, 241)",
    "rgb(236, 72, 153)",
    "rgb(245, 158, 11)",
    "rgb(16, 185, 129)",
    "rgb(139, 92, 246)",
    "rgb(239, 68, 68)",
    "rgb(107, 114, 128)"
  ];

  return (
    <Card>
      <Typography variant="h3" className="mb-4">
        Best Selling Products
      </Typography>

      <CardContent className="pb-2">
        <div className="relative h-[18.625rem]">
          {mounted && !loading ? (
            <Pie
              data={{
                labels,
                datasets: [
                  {
                    label: "Orders",
                    data,
                    backgroundColor: backgroundColor.slice(0, data.length),
                    borderColor:
                      theme === "light" ? "rgb(255,255,255)" : "rgb(23,23,23)",
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
              }}
            />
          ) : (
            <Skeleton className="size-full" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
