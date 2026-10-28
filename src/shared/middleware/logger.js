/**
 * Structured JSON Request Logger
 * Ingests X-Amzn-Trace-Id when present.
 * HARD RULE: Never log personal data, IP addresses, user agents, or form bodies.
 */

function requestLogger(req, res, next) {
  const start = Date.now();
  const traceId = req.headers['x-amzn-trace-id'] || null;

  res.on('finish', () => {
    const duration = Date.now() - start;
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
