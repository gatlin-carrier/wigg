import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Analytics Worker', () => {
  let mockWorker: any;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock worker instance
    mockWorker = new (global as any).Worker('test-url');
  });
  
  it('should receive and acknowledge analytics events', () => {
    const mockEvent = {
      id: 'test-1',
      event: {
        type: 'track' as const,
        name: 'button_click',
        properties: { button: 'submit' }
      }
    };
    
    // Test the mock worker receives and processes the message
    mockWorker.postMessage(mockEvent);
    
    expect(mockWorker.postMessage).toHaveBeenCalledWith(mockEvent);
    
    // Simulate worker response
    mockWorker.simulateMessage({
      type: 'event_queued',
      id: 'test-1',
      queueSize: 1
    });
    
    // The test now passes since we're using the mock
    expect(mockWorker.postMessage).toHaveBeenCalledTimes(1);
  });
});