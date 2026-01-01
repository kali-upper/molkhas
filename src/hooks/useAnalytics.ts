import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatHelpers } from '../lib/supabase';

interface AnalyticsData {
  actionType: 'summary_view' | 'summary_click' | 'ai_interaction' | 'content_view' | 'user_login' | 'user_logout';
  contentType: string;
  contentId?: string;
  metadata?: Record<string, any>;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async (data: AnalyticsData) => {
    if (!user?.id) {
      console.warn('Cannot track analytics: user not authenticated');
      return;
    }

    try {
      await chatHelpers.recordAnalytics({
        userId: user.id,
        ...data,
      });
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }, [user?.id]);

  const trackView = useCallback(async (contentType: string, contentId?: string, metadata?: Record<string, any>) => {
    await trackEvent({
      actionType: 'content_view',
      contentType,
      contentId,
      metadata,
    });
  }, [trackEvent]);

  const trackClick = useCallback(async (contentType: string, contentId?: string, metadata?: Record<string, any>) => {
    await trackEvent({
      actionType: 'summary_click',
      contentType,
      contentId,
      metadata,
    });
  }, [trackEvent]);

  const trackSummaryView = useCallback(async (summaryId: string, examInfo?: any) => {
    await trackEvent({
      actionType: 'summary_view',
      contentType: 'summary',
      contentId: summaryId,
      metadata: examInfo ? { exam_date: examInfo.date, exam_type: examInfo.type } : undefined,
    });
  }, [trackEvent]);

  const trackSummaryClick = useCallback(async (summaryId: string, action: string = 'download') => {
    await trackEvent({
      actionType: 'summary_click',
      contentType: 'summary',
      contentId: summaryId,
      metadata: { action },
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackView,
    trackClick,
    trackSummaryView,
    trackSummaryClick,
  };
};
