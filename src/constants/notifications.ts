/**
 * Notification type definitions and configurations
 */
export const NOTIFICATION_TYPES = {
  ADMIN_SUBMISSION: 'admin_submission',
  CONTENT_PUBLISHED: 'content_published',
  SYSTEM: 'system',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

/**
 * Notification styling configurations
 */
export const NOTIFICATION_STYLES = {
  container: 'absolute left-1/2 -translate-x-1/3 mt-2 w-96 sm:w-[26rem] max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50',
  header: 'p-4 border-b border-gray-200 dark:border-gray-700',
  list: 'max-h-96 overflow-y-auto',
  footer: 'p-3 border-t border-gray-200 dark:border-gray-700 text-center',
  emptyState: 'p-8 text-center',
  item: {
    base: 'p-4 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors',
    unread: 'bg-blue-50 dark:bg-blue-900/20',
  },
  badge: 'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center',
} as const;

/**
 * ARIA labels and accessibility text
 */
export const NOTIFICATION_ACCESSIBILITY = {
  dropdown: 'قائمة الإشعارات',
  bellButton: 'الإشعارات',
  closeButton: 'إغلاق قائمة الإشعارات',
  markAllRead: 'تحديد الكل كمقروء',
  deleteNotification: 'حذف الإشعار',
  loading: 'جاري التحميل...',
  empty: 'لا توجد إشعارات',
  unreadBadge: 'عدد الإشعارات غير المقروءة',
} as const;

/**
 * Maximum notifications to display
 */
export const NOTIFICATION_LIMITS = {
  DISPLAY_MAX: 50,
  UNREAD_BADGE_MAX: 9,
} as const;
