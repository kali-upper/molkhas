import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, SystemLog } from '../lib/analytics';

export const useAnalytics = () => {
  const location = useLocation();

  // Track page views automatically when location changes
  useEffect(() => {
    analytics.trackPageView();
  }, [location.pathname]);

  const trackEvent = useCallback((eventName: string, metadata?: Record<string, any>) => {
    analytics.trackEvent(eventName, metadata);
  }, []);

  const logError = useCallback((error: Error | string, context?: Partial<SystemLog>) => {
    analytics.logError(error, context);
  }, []);

  const log = useCallback((logData: SystemLog) => {
    analytics.log(logData);
  }, []);

  const trackSummaryView = useCallback((id: string, examInfo?: any) => {
    trackEvent('summary_view', { id, ...examInfo });
  }, [trackEvent]);

  const trackSummaryClick = useCallback((id: string, action: string) => {
    trackEvent('summary_click', { id, action });
  }, [trackEvent]);

  const trackClick = useCallback((contentType: string, contentId?: string, metadata?: any) => {
    trackEvent('click', { contentType, contentId, ...metadata });
  }, [trackEvent]);

  return {
    trackEvent,
    logError,
    log,
    trackSummaryView,
    trackSummaryClick,
    trackClick
  };
};
