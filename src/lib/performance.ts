// Performance monitoring utilities
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  navigationType?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // Monitor Core Web Vitals
    this.observeCLS();
    this.observeFID();
    this.observeLCP();
    this.observeFCP();
    this.observeTTFB();

    // Monitor navigation timing
    this.observeNavigationTiming();

    // Monitor resource loading
    this.observeResourceTiming();
  }

  private observeCLS() {
    let clsValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          sessionEntries.push(entry);
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    // Report CLS on page hide
    const reportCLS = () => {
      if (clsValue > 0) {
        this.recordMetric('CLS', clsValue);
        console.log(`CLS: ${clsValue}`);
      }
    };

    window.addEventListener('pagehide', reportCLS);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportCLS();
      }
    });
  }

  private observeFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const eventEntry = entry as PerformanceEventTiming;
        this.recordMetric('FID', eventEntry.processingStart - eventEntry.startTime);
        console.log(`FID: ${eventEntry.processingStart - eventEntry.startTime}ms`);
      }
    });

    observer.observe({ entryTypes: ['first-input'] });
  }

  private observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', lastEntry.startTime);
      console.log(`LCP: ${lastEntry.startTime}ms`);
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private observeFCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('FCP', lastEntry.startTime);
      console.log(`FCP: ${lastEntry.startTime}ms`);
    });

    observer.observe({ entryTypes: ['paint'] });
  }

  private observeTTFB() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const navEntry = entry as PerformanceNavigationTiming;
        this.recordMetric('TTFB', navEntry.responseStart);
        console.log(`TTFB: ${navEntry.responseStart}ms`);
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
  }

  private observeNavigationTiming() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.recordMetric('DOM Content Loaded', navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart);
          this.recordMetric('Load Complete', navigation.loadEventEnd - navigation.loadEventStart);
          console.log(`Page Load Time: ${navigation.loadEventEnd - navigation.loadEventStart}ms`);
        }
      }, 0);
    });
  }

  private observeResourceTiming() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;
        if (resourceEntry.duration > 1000) { // Log slow resources (>1s)
          console.log(`Slow resource: ${resourceEntry.name} (${resourceEntry.duration}ms)`);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value * 100) / 100,
      timestamp: Date.now(),
      navigationType: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type
    };

    this.metrics.push(metric);

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: name,
        value: Math.round(value),
        non_interaction: true,
      });
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public clearMetrics(): void {
    this.metrics = [];
  }
}

// Initialize performance monitoring
export const performanceMonitor = new PerformanceMonitor();

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
}
