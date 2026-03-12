import axiosInstance from "@/helpers/axiosInstance";
import type { Notification } from "@/types/api";

export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const { data } = await axiosInstance.get(`/api/notifications`);
    if (!data.success) return [];
    return data.data || [];
  } catch (error: unknown) {
    console.error("Error fetching notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead({ notificationId }: { notificationId: string }) {
  try {
    const { data } = await axiosInstance.put(`/api/notifications/${notificationId}`, {
      is_read: true,
    });
    return data;
  } catch (error: unknown) {
    console.error("Error marking notification as read:", error);
  }
}

export async function deleteNotification({ notificationId }: { notificationId: string }) {
  try {
    const { data } = await axiosInstance.delete(`/api/notifications/${notificationId}`);
    if (!data.success) throw new Error("Could not dismiss the notification.");
    return data;
  } catch (error: unknown) {
    console.error("Error deleting notification:", error);
    const errorMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Could not dismiss the notification.";
    throw new Error(errorMessage);
  }
}

export async function fetchNotificationsCount(): Promise<number> {
  try {
    const { data } = await axiosInstance.get(`/api/notifications/count`);
    if (!data.success) return 0;
    return data.data || 0;
  } catch (error: unknown) {
    console.error("Error fetching notification count:", error);
    return 0;
  }
}