"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/context/NotificationsContext";
import {
  Bell,
  X,
  Check,
  CheckCircle,
  AlertCircle,
  Info,
  Clock,
  Mail,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NotificationComponent = () => {
  const {
    notifications,
    loading,
    markAsSeen,
    markAllAsSeen,
    showNotificationPanel,
    toggleNotificationPanel,
    unreadCount,
    fetchNotifications,
  } = useNotifications();
  const { user } = useAuth();
  const [expandedNotifications, setExpandedNotifications] = useState({});
  const [showIndividualNotifications, setShowIndividualNotifications] =
    useState([]);
  const [autoCloseTime] = useState(8000); // 8 seconds

  // Toggle notification expansion
  const toggleExpand = (notificationId) => {
    setExpandedNotifications((prev) => ({
      ...prev,
      [notificationId]: !prev[notificationId],
    }));
  };

  // Get notification icon based on message type
  const getNotificationIcon = (message) => {
    if (message.includes("approved") || message.includes("success")) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (message.includes("rejected") || message.includes("error")) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    } else if (message.includes("pending") || message.includes("waiting")) {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    } else if (message.includes("email") || message.includes("message")) {
      return <Mail className="w-5 h-5 text-blue-500" />;
    } else if (message.includes("warning")) {
      return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    } else {
      return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  // Handle ESC key press to close notifications and panel
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        // Close all individual notifications
        setShowIndividualNotifications([]);
        
        // Close notification panel if open
        if (showNotificationPanel) {
          toggleNotificationPanel();
        }
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showNotificationPanel, toggleNotificationPanel]);

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return "Just now";
    }
  };

  // Show individual notification popups at bottom-left
  useEffect(() => {
    if (notifications.length > 0) {
      const newNotifications = notifications.filter(
        (notification) =>
          !showIndividualNotifications.includes(notification._id)
      );

      newNotifications.forEach((notification, index) => {
        // Add to shown notifications
        setShowIndividualNotifications((prev) => [...prev, notification._id]);

        // Auto-remove after delay
        const timer = setTimeout(() => {
          setShowIndividualNotifications((prev) =>
            prev.filter((id) => id !== notification._id)
          );
        }, autoCloseTime + index * 1000); // Stagger notifications

        return () => clearTimeout(timer);
      });
    }
  }, [notifications, autoCloseTime]);

  // Handle marking notification as seen
  const handleMarkAsSeen = async (notificationId) => {
    await markAsSeen(notificationId);
    // Remove from individual notifications if shown
    setShowIndividualNotifications((prev) =>
      prev.filter((id) => id !== notificationId)
    );
  };

  // Close all individual notifications
  const closeAllIndividualNotifications = () => {
    setShowIndividualNotifications([]);
  };

  // Handle marking all as seen
  const handleMarkAllAsSeen = async () => {
    await markAllAsSeen();
    setShowIndividualNotifications([]);
  };

  // Refresh notifications
  const handleRefresh = async () => {
    await fetchNotifications();
  };

  if (!user) {
    return <></>;
  }

  return (
    <>
      {/* Notification Bell Icon - Positioned at bottom-right with responsive adjustments */}
      <button
        onClick={toggleNotificationPanel}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 p-2 sm:p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        title="Notifications"
      >
        <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center animate-pulse shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Individual Notification Popups at Bottom-Right with responsive adjustments */}
      {showIndividualNotifications.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 space-y-2 sm:space-y-3 w-[calc(100%-2rem)] sm:w-auto sm:max-w-sm">
          {/* Close All Button for Individual Notifications */}
          <div className="flex justify-end mb-1 sm:mb-2">
            <button
              onClick={closeAllIndividualNotifications}
              className="px-2 sm:px-3 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="Close all notifications"
            >
              Close All (ESC)
            </button>
          </div>
          
          {showIndividualNotifications.map((notificationId) => {
            const notification = notifications.find(
              (n) => n._id === notificationId
            );
            if (!notification) return null;

            return (
              <div
                key={notification._id}
                className="bg-white rounded-lg shadow-xl border border-gray-200 animate-slide-up"
              >
                <div className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {getNotificationIcon(notification.message)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 sm:gap-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-900 break-words pr-1">
                          {notification.message.length > 80
                            ? `${notification.message.substring(0, 80)}...`
                            : notification.message}
                        </p>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleMarkAsSeen(notification._id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setShowIndividualNotifications((prev) =>
                                prev.filter((id) => id !== notification._id)
                              );
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Dismiss"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1 sm:mt-2">
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(notification.createdAt)}
                        </p>

                        {notification.message.length > 80 && (
                          <button
                            onClick={() => toggleExpand(notification._id)}
                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            {expandedNotifications[notification._id] ? (
                              <>
                                Show less <ChevronDown className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                Read more <ChevronRight className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {expandedNotifications[notification._id] && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-700 break-words">
                            {notification.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Notification Panel (Full Screen Modal) - Fully responsive */}
      {showNotificationPanel && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={toggleNotificationPanel}
          />

          {/* Panel - Responsive positioning */}
          <div className="absolute bottom-4 right-1 sm:bottom-4 sm:right-4 w-96 bg-white rounded-xl sm:rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-slide-up max-h-[80vh] sm:max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2 sm:gap-3">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900">Notifications</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {unreadCount} unread{" "}
                    {unreadCount === 1 ? "notification" : "notifications"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={handleRefresh}
                  className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <svg
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsSeen}
                    className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}

                <button
                  onClick={toggleNotificationPanel}
                  className="p-1.5 sm:p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close (ESC)"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <Bell className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2 sm:mb-3" />
                  <p className="text-sm sm:text-base text-gray-600">No new notifications</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    You&apos;re all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className="p-3 sm:p-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          {getNotificationIcon(notification.message)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1 sm:gap-2">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 break-words pr-1">
                              {notification.message.length > 60
                                ? `${notification.message.substring(0, 60)}...`
                                : notification.message}
                            </p>
                            <button
                              onClick={() => handleMarkAsSeen(notification._id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
                              title="Mark as read"
                            >
                              <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-1 sm:mt-2">
                            <p className="text-xs text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </p>

                            {notification.message.length > 60 && (
                              <button
                                onClick={() => toggleExpand(notification._id)}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                {expandedNotifications[notification._id] ? (
                                  <>
                                    Show less{" "}
                                    <ChevronDown className="w-3 h-3" />
                                  </>
                                ) : (
                                  <>
                                    Read more{" "}
                                    <ChevronRight className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {expandedNotifications[notification._id] && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                              <p className="text-xs sm:text-sm text-gray-700 break-words">
                                {notification.message}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4">
                  <button
                    onClick={handleMarkAllAsSeen}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Mark all as read
                  </button>
                  
                  <button
                    onClick={closeAllIndividualNotifications}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Close popups
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add custom CSS for animations */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
};

export default NotificationComponent;