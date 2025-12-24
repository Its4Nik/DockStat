FROM oven/bun:latest AS runtime
WORKDIR /opt/dockstore-verification

# Create directories
RUN mkdir -p data public

# Copy built application
COPY ./dist/index.js ./index.js
COPY ./public ./public

# Set environment variables
ENV VERIFICATION_DB_PATH=data/verification.db
ENV NODE_ENV=production

ENV DOCKSTAT_LOGGER_DISABLED_LOGGERS="QueryBuilder,Sqlite-Wrapper"
ENV DOCKSTAT_LOGGER_ONLY_SHOW=""
ENV DOCKSTAT_LOGGER_IGNORE_MESSAGES="Logger Status: active"
ENV DOCKSTAT_LOGGER_FULL_FILE_PATH=false
ENV VERIFICATION_PORT=3200

# Expose port
EXPOSE 3200/tcp

# Create volumes for persistent data
VOLUME ["/opt/dockstore-verification/data"]
VOLUME ["/opt/dockstore-verification/public"]

# Run the application
ENTRYPOINT ["bun", "run", "--bun", "index.js"]
