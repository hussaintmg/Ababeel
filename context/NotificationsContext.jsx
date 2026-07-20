"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const NotificationsContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
};

export const NotificationsProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      try {
        const response = await fetch("/api/notifications");

        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }

        const data = await response.json();

        if (data.success) {
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.log("Notification Error: ", err);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as seen
  const markAsSeen = async (notificationId) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as seen");
      }

      const data = await response.json();

      if (data.success) {
        // Remove the notification from local state
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );

        toast.success("Notification marked as read");
      }
    } catch (error) {
      console.error("Error marking notification as seen:", error);
      toast.error("Failed to mark notification as read");
    }
  };

  // Mark all notifications as seen
  const markAllAsSeen = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as seen");
      }

      const data = await response.json();

      if (data.success) {
        setNotifications([]);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Error marking all notifications as seen:", error);
      toast.error("Failed to mark all notifications as read");
    }
  };

  // Toggle notification panel
  const toggleNotificationPanel = () => {
    setShowNotificationPanel(!showNotificationPanel);
  };

  // Only fetch/poll for a signed-in user. Polling while signed out produced a
  // 401 every 30 seconds on public pages.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [authLoading, user]);

  const value = {
    notifications,
    loading,
    fetchNotifications,
    markAsSeen,
    markAllAsSeen,
    showNotificationPanel,
    toggleNotificationPanel,
    unreadCount: notifications.length,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
