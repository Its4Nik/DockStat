FROM oven/bun:canary AS base
WORKDIR /app/usr/docknode

# Create directories
RUN mkdir -p stacks

# Copy built application
COPY ./dist/index.js ./DockNode.js

FROM oven/bun:canary-distroless AS runtime
WORKDIR /opt/docknode

COPY --from=base /app/usr/docknode/DockNode.js ./DockNode.js

# Set environment variables
ENV NODE_ENV=production

ENV DOCKSTAT_LOGGER_DISABLED_LOGGERS="QueryBuilder,Sqlite-Wrapper"
ENV DOCKSTAT_LOGGER_IGNORE_MESSAGES="Logger Status: active"
ENV DOCKSTAT_LOGGER_FULL_FILE_PATH=false
ENV DOCKSTAT_LOGGER_LEVEL=info

ENV DOCKER_BIN_PATH="/opt/docknode/bin/docker"
ENV DOCKER_SOCKET_PATH="/var/run/docker.sock"

# Expose port
EXPOSE 4040/tcp

# Create volumes for persistent data
VOLUME ["/opt/docknode"]
VOLUME ["/opt/docknode/stacks"]

# Run the application
ENTRYPOINT ["bun", "run", "--bun", "DockNode.js"]
