const crypto = require('crypto');

function correlationIdMiddleware(req, res, next) {
  const correlationId =
    req.headers['x-correlation-id'] ||
    req.headers['x-request-id'] ||
    crypto.randomUUID();

  req.correlationId = correlationId;
  req.id = correlationId;

  res.setHeader('X-Correlation-ID', correlationId);

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const isError = status >= 400;

    const logFn = isError ? console.warn : console.log;
    logFn(
      `[${new Date().toISOString()}] [${correlationId}] ${req.method} ${req.originalUrl} - ${status} (${duration}ms)`
    );
  });

  next();
}

module.exports = {
  correlationIdMiddleware,
};
