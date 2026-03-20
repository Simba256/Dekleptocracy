/**
 * Sentry integration stub.
 *
 * To activate:
 * 1. npm install @sentry/node
 * 2. Set SENTRY_DSN in your .env
 * 3. Uncomment the Sentry.init block below
 *
 * When SENTRY_DSN is not set, all functions are no-ops.
 */

const SENTRY_DSN = process.env.SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) return;

  // Uncomment after installing @sentry/node:
  // import * as Sentry from '@sentry/node';
  // Sentry.init({ dsn: SENTRY_DSN });
}

export function setupSentryErrorHandler(app) {
  if (!SENTRY_DSN) return;

  // Uncomment after installing @sentry/node:
  // import * as Sentry from '@sentry/node';
  // Sentry.setupExpressErrorHandler(app);
}
