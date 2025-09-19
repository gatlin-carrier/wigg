// Telemetry and error handling for Smart Search

import type { SearchTelemetry, ResolvedSearch } from './types';

// Error types for better error handling
export class SmartSearchError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SmartSearchError';
  }
}

export class ProviderError extends SmartSearchError {
  constructor(
    provider: string,
    message: string,
    public statusCode?: number
  ) {
    super(`${provider} error: ${message}`, 'PROVIDER_ERROR', { provider, statusCode });
  }
}

export class ValidationError extends SmartSearchError {
  constructor(field: string, value: any) {
    super(`Invalid ${field}: ${value}`, 'VALIDATION_ERROR', { field, value });
  }
}

export class TimeoutError extends SmartSearchError {
  constructor(operation: string, timeout: number) {
    super(`${operation} timed out after ${timeout}ms`, 'TIMEOUT_ERROR', { operation, timeout });
  }
}

// Telemetry collector
export class SearchTelemetryCollector {
  private data: Partial<SearchTelemetry> = {
    api_errors: [],
    providers_called: [],
  };
  private startTime: number;
  
  constructor() {
    this.startTime = performance.now();
  }
  
  // Mark when planning completes
  markPlanningComplete(): void {
    this.data.time_to_first_plan_ms = Math.round(performance.now() - this.startTime);
  }
  
  // Add provider that was called
  addProvider(provider: string): void {
    if (!this.data.providers_called?.includes(provider)) {
      this.data.providers_called?.push(provider);
    }
  }
  
  // Add API error
  addApiError(error: string): void {
    this.data.api_errors?.push(error);
  }
  
  // Mark search resolution complete
  markResolutionComplete(resolved: ResolvedSearch): void {
    this.data.time_to_resolve_ms = Math.round(performance.now() - this.startTime);
    this.data.decision_mode = resolved.decision.mode;
    this.data.confidence = resolved.decision.confidence;
  }
  
  // Mark user refinement
  markUserRefinement(refined: boolean): void {
    this.data.user_refined_via_chip = refined;
  }
  
  // Mark user feedback
  markUserFeedback(wrong: boolean): void {
    this.data.wrong_vertical_feedback = wrong;
  }
  
  // Get collected telemetry
  getTelemetry(): SearchTelemetry {
    return {
      time_to_first_plan_ms: this.data.time_to_first_plan_ms || 0,
      time_to_resolve_ms: this.data.time_to_resolve_ms || 0,
      providers_called: this.data.providers_called || [],
      api_errors: this.data.api_errors || [],
      decision_mode: this.data.decision_mode || 'disambiguate',
      confidence: this.data.confidence || 0,
      user_refined_via_chip: this.data.user_refined_via_chip,
      wrong_vertical_feedback: this.data.wrong_vertical_feedback,
    };
  }
}

// Error recovery strategies
export class ErrorRecovery {
  
  // Retry with exponential backoff
  static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) break;
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`[SmartSearch] Retry ${attempt + 1}/${maxRetries} failed:`, lastError.message);
      }
    }
    
    throw lastError;
  }
  
  // Graceful degradation - continue with partial results
  static handleProviderFailure(
    provider: string, 
    error: Error, 
    results: any[] = []
  ): { 
    shouldContinue: boolean; 
    fallbackResults: any[]; 
    error: ProviderError;
  } {
    const providerError = new ProviderError(provider, error.message);
    
    // If we have some results from other providers, continue
    const shouldContinue = results.length > 0;
    
    // Could implement provider-specific fallback logic here
    let fallbackResults: any[] = [];
    
    if (provider === 'tmdb' && results.length === 0) {
      // TMDB is critical - try to use cached popular content
      fallbackResults = []; // Could load from cache
    }
    
    return {
      shouldContinue,
      fallbackResults,
      error: providerError,
    };
  }
  
  // Rate limiting detection and backoff
  static isRateLimited(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('429') || 
           message.includes('rate limit') || 
           message.includes('too many requests');
  }
  
  // Network error detection
  static isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('timeout') || 
           message.includes('connection') ||
           message.includes('fetch');
  }
  
  // Get user-friendly error message
  static getUserFriendlyMessage(error: Error): string {
    if (error instanceof ValidationError) {
      return 'Please check your search query and try again.';
    }
    
    if (error instanceof TimeoutError) {
      return 'Search is taking longer than expected. Please try again.';
    }
    
    if (error instanceof ProviderError) {
      if (this.isRateLimited(error)) {
        return 'Too many searches. Please wait a moment and try again.';
      }
      
      if (this.isNetworkError(error)) {
        return 'Network connection issue. Please check your internet and try again.';
      }
      
      return 'Search service temporarily unavailable. Please try again later.';
    }
    
    return 'Something went wrong. Please try again.';
  }
}

// Telemetry service for sending data
export class TelemetryService {
  private static instance: TelemetryService;
  private buffer: SearchTelemetry[] = [];
  private flushInterval: number;
  
  private constructor() {
    // Flush telemetry every 30 seconds
    this.flushInterval = window.setInterval(() => {
      this.flush();
    }, 30000);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }
  
  static getInstance(): TelemetryService {
    if (!this.instance) {
      this.instance = new TelemetryService();
    }
    return this.instance;
  }
  
  // Add telemetry to buffer
  track(telemetry: SearchTelemetry): void {
    this.buffer.push({
      ...telemetry,
      timestamp: Date.now(),
    } as any);
    
    // Flush if buffer is getting full
    if (this.buffer.length >= 10) {
      this.flush();
    }
  }
  
  // Flush telemetry to analytics service
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const data = [...this.buffer];
    this.buffer = [];
    
    try {
      // Send to Vercel Analytics
      console.log('[SmartSearch] Telemetry batch:', data);
      
      // Example: send to analytics service
      // await fetch('/api/analytics/search', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      
    } catch (error) {
      console.warn('[SmartSearch] Failed to send telemetry:', error);
      // Re-add data to buffer for retry
      this.buffer.unshift(...data);
    }
  }
  
  // Cleanup resources
  destroy(): void {
    clearInterval(this.flushInterval);
    this.flush();
  }
}

// Global error handler for unhandled smart search errors
export function setupGlobalErrorHandler(): void {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason instanceof SmartSearchError) {
      console.error('[SmartSearch] Unhandled error:', event.reason);
      
      // Could send error to monitoring service
      TelemetryService.getInstance().track({
        time_to_first_plan_ms: 0,
        time_to_resolve_ms: 0,
        providers_called: [],
        api_errors: [event.reason.message],
        decision_mode: 'disambiguate',
        confidence: 0,
      });
      
      // Prevent default browser error handling
      event.preventDefault();
    }
  });
}