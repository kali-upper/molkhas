import { X } from "lucide-react";
import { NOTIFICATION_ACCESSIBILITY } from "../constants/notifications";

interface NotificationHeaderProps {
  unreadCount: number;
  onClose: () => void;
  onMarkAllAsRead?: () => void;
  isMarkingAll?: boolean;
}

export function NotificationHeader({
  unreadCount,
  onClose,
  onMarkAllAsRead,
  isMarkingAll = false,
}: NotificationHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between flex-row-reverse">
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={NOTIFICATION_ACCESSIBILITY.closeButton}
          aria-label={NOTIFICATION_ACCESSIBILITY.closeButton}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 rtl:space-x-reverse">
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              onClick={onMarkAllAsRead}
              disabled={isMarkingAll}
              className={`text-sm font-medium transition-colors rounded px-2 py-1 ${
                isMarkingAll
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              }`}
              title="تحديد جميع الإشعارات كمقروءة"
              aria-label={`تحديد ${unreadCount} إشعار كمقروء`}
            >
              {isMarkingAll ? (
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                  جاري التحديث...
                </span>
              ) : (
                "تحديد الكل كمقروء"
              )}
            </button>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-shrink-0">
          الإشعارات
          {unreadCount > 0 && (
            <span className="mr-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              ({unreadCount})
            </span>
          )}
        </h3>
      </div>
    </div>
  );
}
