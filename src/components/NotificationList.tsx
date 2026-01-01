import { Bell } from "lucide-react";
import type { Notification } from "../types/database";
import { NotificationItem } from "./NotificationItem";
import {
  NOTIFICATION_STYLES,
  NOTIFICATION_ACCESSIBILITY,
} from "../constants/notifications";

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onNotificationClick: (notification: Notification) => void;
  onNotificationDelete: (notificationId: string) => void;
}

function LoadingState() {
  return (
    <div className={NOTIFICATION_STYLES.emptyState}>
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mt-2">
        {NOTIFICATION_ACCESSIBILITY.loading}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={NOTIFICATION_STYLES.emptyState}>
      <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
      <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
        {NOTIFICATION_ACCESSIBILITY.empty}
      </p>
    </div>
  );
}

export function NotificationList({
  notifications,
  loading,
  onNotificationClick,
  onNotificationDelete,
}: NotificationListProps) {
  if (loading) {
    return <LoadingState />;
  }

  if (notifications.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      className={NOTIFICATION_STYLES.list}
      role="list"
      aria-label="قائمة الإشعارات"
    >
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {notifications.map((notification) => (
          <div key={notification.id} role="listitem">
            <NotificationItem
              notification={notification}
              onClick={onNotificationClick}
              onDelete={onNotificationDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
