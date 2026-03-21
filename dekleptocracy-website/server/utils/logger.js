/**
 * Simple logging utility for error tracking
 * In production, you can replace this with a service like Sentry, LogRocket, or Winston
 */

export const logger = {
  info: (message, context = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context);
  },

  warn: (message, context = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context);
  },

  error: (message, error = null, context = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
      ...context,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : null,
    });
  },

  api: (req, statusCode, message = '', responseTime = null) => {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString(),
    };

    if (responseTime) {
      logData.responseTime = `${responseTime}ms`;
    }

    if (message) {
      logData.message = message;
    }

    if (statusCode >= 400) {
      console.error('[API ERROR]', logData);
    } else {
      console.log('[API]', logData);
    }
  },
};

export default logger;
