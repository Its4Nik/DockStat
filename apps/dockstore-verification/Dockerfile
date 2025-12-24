# Multi-stage build for DockStore Verification API
# This Dockerfile should be run from the monorepo root

FROM oven/bun:latest AS builder
WORKDIR /workspace

# Copy workspace files
COPY package.json bun.lockb ./
COPY apps/dockstore-verification ./apps/dockstore-verification
COPY packages ./packages

# Install all workspace dependencies
RUN bun install --frozen-lockfile

# Build the verification app
WORKDIR /workspace/apps/dockstore-verification
RUN bun run build

# Production stage
FROM oven/bun:latest AS runtime
WORKDIR /opt/dockstore-verification

# Create directories
RUN mkdir -p data public

# Copy built application from builder
COPY --from=builder /workspace/apps/dockstore-verification/dist/index.js ./index.js
COPY --from=builder /workspace/apps/dockstore-verification/public ./public

# Set environment variables
ENV VERIFICATION_DB_PATH=data/verification.db
ENV NODE_ENV=production

# Expose port
EXPOSE 3000/tcp

# Create volumes for persistent data
VOLUME ["/opt/dockstore-verification/data"]
VOLUME ["/opt/dockstore-verification/public"]

# Run the application
ENTRYPOINT ["bun", "run", "--bun", "index.js"]
