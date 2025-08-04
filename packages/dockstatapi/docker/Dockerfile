ARG BUILD_DATE
ARG VCS_REF

FROM oven/bun:alpine AS base
WORKDIR /base

COPY package.json ./
RUN bun install -p

COPY . .

FROM oven/bun:alpine AS production
WORKDIR /DockStatAPI

LABEL org.opencontainers.image.title="DockStatAPI" \
    org.opencontainers.image.description="A Dockerized DockStatAPI built with Bun on Alpine Linux." \
    org.opencontainers.image.version="3.0.0" \
    org.opencontainers.image.authors="info@itsnik.de" \
    org.opencontainers.image.vendor="Its4Nik" \
    org.opencontainers.image.licenses="CC BY-NC 4.0" \
    org.opencontainers.image.created=$BUILD_DATE \
    org.opencontainers.image.revision=$VCS_REF

RUN apk add --no-cache curl

HEALTHCHECK --timeout=10s --start-period=2s --retries=3 \
    CMD curl --fail http://localhost:3000/health || exit 1

VOLUME [ "/DockStatAPI/src/plugins" ]

ENV NODE_ENV=production
ENV LOG_LEVEL=info

EXPOSE 3000

COPY --from=base /base /DockStatAPI

RUN adduser -D DockStatAPI && chown -R DockStatAPI:DockStatAPI /DockStatAPI
USER DockStatAPI

ENTRYPOINT [ "bun", "run", "src/index.ts" ]
