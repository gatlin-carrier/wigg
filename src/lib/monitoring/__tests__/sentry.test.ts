import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Sentry from '@sentry/react';

// Mock Sentry module
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  consoleLoggingIntegration: vi.fn((config) => ({ type: 'consoleLoggingIntegration', config })),
}));

describe('Sentry monitoring configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should have initSentry function available for import', async () => {
    const sentryModule = await import('../sentry');
    expect(sentryModule.initSentry).toBeTypeOf('function');
  });

  it('should call Sentry.init when DSN is provided', async () => {
    // Arrange
    vi.stubGlobal('import', {
      meta: {
        env: {
          VITE_SENTRY_DSN: 'test-dsn-123',
          VITE_SENTRY_ENVIRONMENT: 'production',
          VITE_SENTRY_RELEASE: 'v1.0.0',
        }
      }
    });

    const { initSentry } = await import('../sentry');

    // Act
    initSentry();

    // Assert
    expect(Sentry.init).toHaveBeenCalledWith({
      dsn: 'test-dsn-123',
      environment: 'production',
      release: 'v1.0.0',
      enableLogs: true,
      integrations: [
        Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
      ],
      sendDefaultPii: true
    });
  });

  it('should not call Sentry.init when DSN is not provided', async () => {
    // Arrange
    (import.meta as any).env = {};

    const { initSentry } = await import('../sentry');

    // Act
    initSentry();

    // Assert
    expect(Sentry.init).not.toHaveBeenCalled();
  });
});