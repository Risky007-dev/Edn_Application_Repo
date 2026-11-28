# ==============================================================================
# Tutor Time & Popcorn Math — Zero-VM Container Image (AWS Lambda + Local Docker)
# Builds AWS Lambda Web Adapter 0.8.4 from official GitHub source (SHA-256 verified)
# so CI never hits public.ecr.aws anonymous 429 rate limits.
# ==============================================================================
FROM rust:1-alpine AS lwa-builder

ARG LWA_VERSION=0.8.4
ARG LWA_SHA256=3b86a37ef566162752e817e3c3c98e6c90d4591d4b5f18056dc91e589adf4a27

RUN apk add --no-cache curl musl-dev && \
    curl --fail --retry 5 --retry-delay 2 -sSL \
      "https://github.com/awslabs/aws-lambda-web-adapter/archive/refs/tags/v${LWA_VERSION}.tar.gz" \
      -o /tmp/lwa.tar.gz && \
    echo "${LWA_SHA256}  /tmp/lwa.tar.gz" | sha256sum -c - && \
    mkdir -p /src && \
    tar -xzf /tmp/lwa.tar.gz -C /src --strip-components=1 && \
    rm -f /tmp/lwa.tar.gz

WORKDIR /src
RUN CARGO_TARGET_X86_64_UNKNOWN_LINUX_MUSL_LINKER=gcc \
    RUSTFLAGS="-C target-feature=+crt-static" \
    cargo build --release --target x86_64-unknown-linux-musl --bin lambda-adapter && \
    strip target/x86_64-unknown-linux-musl/release/lambda-adapter

FROM node:24-alpine

# AWS Lambda Web Adapter extension (no-op outside AWS Lambda)
COPY --from=lwa-builder /src/target/x86_64-unknown-linux-musl/release/lambda-adapter /opt/extensions/lambda-adapter
RUN chmod 0755 /opt/extensions/lambda-adapter

WORKDIR /app

# Deterministic production dependency install; remove unused global npm/npx CLI from runtime image
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    npm cache clean --force && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

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
