"use client";

import { useEffect, useState } from "react";
import {
  HiOutlineShoppingCart,
  HiOutlineRefresh,
  HiOutlineCheck,
} from "react-icons/hi";
import { BsTruck } from "react-icons/bs";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import Typography from "@/components/ui/typography";
import { DashboardCard } from "@/types/card";

interface StatusData {
  total: number;
  pending: number;
  processing: number;
  delivered: number;
  cancelled: number;
  shipped: number;
}

export default function StatusOverview() {
  const [statusData, setStatusData] = useState<StatusData>({
    total: 0,
    pending: 0,
    processing: 0,
    delivered: 0,
    cancelled: 0,
    shipped: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/status-overview`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.success) {
          setStatusData(result.data);
        } else {
          console.error('Failed to fetch status data:', result.error);
        }
      } catch (error) {
        console.error('Error fetching status data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusData();
  }, []);

  const cards: DashboardCard[] = [
    {
      icon: <HiOutlineShoppingCart />,
      title: "Total Orders",
      value: loading ? "Loading..." : statusData.total.toString(),
      className:
        "text-orange-600 dark:text-orange-100 bg-orange-100 dark:bg-orange-500",
    },
    {
      icon: <HiOutlineRefresh />,
      title: "Orders Pending",
      value: loading ? "Loading..." : statusData.pending.toString(),
      className:
        "text-teal-600 dark:text-teal-100 bg-teal-100 dark:bg-teal-500",
    },
    {
      icon: <BsTruck />,
      title: "Orders Processing",
      value: loading ? "Loading..." : statusData.processing.toString(),
      className:
        "text-blue-600 dark:text-blue-100 bg-blue-100 dark:bg-blue-500",
    },
    {
      icon: <HiOutlineCheck />,
      title: "Orders Delivered",
      value: loading ? "Loading..." : statusData.delivered.toString(),
      className:
        "text-emerald-600 dark:text-emerald-100 bg-emerald-100 dark:bg-emerald-500",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="flex items-center gap-3 p-0">
            <div
              className={cn(
                "size-12 rounded-full grid place-items-center [&>svg]:size-5",
                card.className
              )}
            >
              {card.icon}
            </div>

            <div className="flex flex-col gap-y-1">
              <Typography className="text-sm text-muted-foreground">
                {card.title}
              </Typography>

              <Typography className="text-2xl font-semibold text-popover-foreground">
                {card.value}
              </Typography>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
