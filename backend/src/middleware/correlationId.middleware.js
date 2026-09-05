const crypto = require('crypto');
const logger = require('../config/logger');

function correlationIdMiddleware(req, res, next) {
  const correlationId =
    req.headers['x-correlation-id'] ||
    req.headers['x-request-id'] ||
    crypto.randomUUID();

  req.correlationId = correlationId;
  req.id = correlationId;
  req.log = logger.child({ correlationId });

  res.setHeader('X-Correlation-ID', correlationId);

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;

    const meta = {
      correlationId,
      method: req.method,
      url: req.originalUrl,
      statusCode: status,
      durationMs: duration,
      ip: req.ip,
    };

    if (status >= 500) {
      req.log.error(meta, `${req.method} ${req.originalUrl} - ${status} (${duration}ms)`);
    } else if (status >= 400) {
      req.log.warn(meta, `${req.method} ${req.originalUrl} - ${status} (${duration}ms)`);
    } else {
      req.log.info(meta, `${req.method} ${req.originalUrl} - ${status} (${duration}ms)`);
    }
  });

  next();
}

module.exports = {
  correlationIdMiddleware,
};
