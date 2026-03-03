"use client";

import { useQuery } from "@tanstack/react-query";
import Typography from "@/components/ui/typography";
import NotificationItem from "./NotificationItem";
import NotificationItemSkeleton from "./NotificationItemSkeleton";
import { fetchNotifications } from "@/services/notifications";
import type { Notification } from "@/types/api";

export default function NotificationContent() {
  const {
    data: notifications,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(),
    refetchInterval: 30000, // catch new low stock alerts every 30s
  });

  if (isLoading) {
    return (
      <>
        {new Array(4).fill(0).map((_, index) => (
          <NotificationItemSkeleton key={`notification-skeleton-${index}`} />
        ))}
      </>
    );
  }

  if (!notifications || isError) {
    return (
      <div className="w-full text-center px-4 py-6">
        <Typography component="p" className="text-sm md:text-sm">
          Something went wrong while fetching notifications. Please try again.
        </Typography>
      </div>
    );
  }

  if (notifications.length > 0) {
    return (
      <>
        {notifications.map((notification: Notification, index: number) => (
          <NotificationItem
            key={`notification-${notification._id ?? index}`}
            notification={notification}
          />
        ))}
      </>
    );
  }

  return (
    <div className="w-full text-center px-4 py-6">
      <Typography component="p" className="text-sm md:text-sm">
        You have no notifications!
      </Typography>
    </div>
  );
}