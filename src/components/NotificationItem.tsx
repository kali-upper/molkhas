import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { Notification } from "../types/database";
import {
  formatTimeAgo,
  getNotificationIcon,
  shouldHighlightNotification,
} from "../utils/notificationUtils";
import {
  NOTIFICATION_STYLES,
  NOTIFICATION_ACCESSIBILITY,
} from "../constants/notifications";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  onDelete: (notificationId: string) => void;
}

export function NotificationItem({
  notification,
  onClick,
  onDelete,
}: NotificationItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isHighlighted = shouldHighlightNotification(notification);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(notification.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClick = () => {
    onClick(notification);
  };

  return (
    <div
      className={`${NOTIFICATION_STYLES.item.base} ${
        isHighlighted ? NOTIFICATION_STYLES.item.unread : ""
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${notification.title}: ${notification.message}`}
    >
      <div className="flex items-start gap-3 rtl:gap-3">
        <div className="text-2xl flex-shrink-0" aria-hidden="true">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {notification.message}
              </p>
              <time
                className="text-xs text-gray-500 dark:text-gray-500 mt-1 block"
                dateTime={notification.created_at}
              >
                {formatTimeAgo(notification.created_at)}
              </time>
            </div>
            <div className="flex items-center gap-1 rtl:gap-1 ml-2">
              {!notification.read && (
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
                  aria-label="إشعار غير مقروء"
                />
              )}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`p-1 text-gray-400 hover:text-red-500 transition-colors rounded ${
                  isDeleting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                title={NOTIFICATION_ACCESSIBILITY.deleteNotification}
                aria-label={`${NOTIFICATION_ACCESSIBILITY.deleteNotification}: ${notification.title}`}
              >
                {isDeleting ? (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
