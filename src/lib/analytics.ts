import { supabase } from './supabase';
import { getSessionId } from './session';

// Types for Analytics
export interface AnalyticsEvent {
    name: string;
    page?: string;
    metadata?: Record<string, any>;
}

export interface SystemLog {
    level: 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    statusCode?: number;
    requestId?: string;
    endpoint?: string;
    metadata?: Record<string, any>;
}

class AnalyticsService {
    /**
     * Tracks a generic event (e.g., "Ai_Assistant_Used", "Feature_Clicked").
     * Uses a random session ID and does NOT track personal user info.
     */
    async trackEvent(eventName: string, metadata: Record<string, any> = {}) {
        try {
            const sessionId = getSessionId();
            const page = window.location.pathname;

            const { error } = await supabase.from('analytics_events').insert({
                session_id: sessionId,
                event_name: eventName,
                page: page,
                metadata: metadata,
            });

            if (error) {
                console.error('Failed to track event:', error);
            }
        } catch (err) {
            console.error('Error tracking event:', err);
        }
    }

    /**
     * Tracks a page view.
     */
    async trackPageView() {
        await this.trackEvent('page_view');
    }

    /**
     * Logs a system error or message.
     * Useful for debugging without exposing user data.
     */
    async log(log: SystemLog) {
        try {
            const { error } = await supabase.from('system_logs').insert({
                level: log.level,
                message: log.message,
                status_code: log.statusCode,
                request_id: log.requestId,
                endpoint: log.endpoint,
                metadata: log.metadata,
            });

            if (error) {
                console.error('Failed to send log:', error);
            }
        } catch (err) {
            console.error('Error sending log:', err);
        }
    }

    /**
     * Helper to log an error specifically.
     */
    async logError(error: Error | string, context: Partial<SystemLog> = {}) {
        const message = error instanceof Error ? error.message : error;
        await this.log({
            level: 'error',
            message,
            ...context,
            metadata: {
                ...(context.metadata || {}),
                stack: error instanceof Error ? error.stack : undefined,
            },
        });
    }
}

export const analytics = new AnalyticsService();
