# ==============================================================================
# Tutor Time & Popcorn Math — Zero-VM Container Image (AWS Lambda + Local Docker)
# Ships AWS Lambda Web Adapter so the exact same immutable image runs on
# AWS Lambda Function URL (behind CloudFront) AND locally via `docker run`.
# ==============================================================================
FROM node:24-alpine

# AWS Lambda Web Adapter extension (no-op outside AWS Lambda)
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

WORKDIR /app

# Deterministic production dependency install
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy runtime application files (never copy env files into container image)
COPY server.js ./
COPY src ./src
COPY MyWebApp ./MyWebApp
COPY docs/legal ./docs/legal
COPY scripts/seed-kashamar.js ./scripts/

# Lambda Web Adapter & runtime defaults
ENV NODE_ENV=production \
    PORT=5001 \
    AWS_LWA_PORT=5001 \
    AWS_LWA_READINESS_CHECK_PATH=/health \
    AWS_LWA_INVOKE_MODE=buffered

RUN chown -R node:node /app
USER node

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["node", "server.js"]
