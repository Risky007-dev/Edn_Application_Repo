/**
 * Structured JSON Request Logger & Tracing Harness
 * Ingests X-Amzn-Trace-Id when present, generates synthetic fallback UUID otherwise,
 * echoes X-Trace-Id and Server-Timing response headers for observability research.
 * HARD RULE: Never log personal data, IP addresses, user agents, or form bodies.
 */

const crypto = require('crypto');

function requestLogger(req, res, next) {
  const startNs = process.hrtime.bigint();
  const incomingTrace = req.headers['x-amzn-trace-id'];
  const traceId = (typeof incomingTrace === 'string' && incomingTrace.trim())
    ? incomingTrace.trim()
    : `local-trace-${crypto.randomUUID()}`;

  req.traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);

  const origWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent && !res.getHeader('Server-Timing')) {
      const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;
      res.setHeader('Server-Timing', `app;dur=${elapsedMs.toFixed(2)}`);
    }
    return origWriteHead.apply(this, args);
  };

  res.on('finish', () => {
    const duration = Number((Number(process.hrtime.bigint() - startNs) / 1e6).toFixed(2));
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.url,
      status: res.statusCode,
      duration,
      traceId
    };

    // Output single-line JSON log suitable for CloudWatch / OTel Collectors
    console.log(JSON.stringify(logEntry));
  });

  next();
}

module.exports = requestLogger;
