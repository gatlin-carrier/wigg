import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT;
  const release = import.meta.env.VITE_SENTRY_RELEASE;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    enableLogs: true,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
    ],
    sendDefaultPii: true
  });
}
