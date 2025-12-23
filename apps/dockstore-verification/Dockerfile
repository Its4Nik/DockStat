FROM oven/bun:latest AS base
WORKDIR /opt/dockstore-verification
VOLUME [ "/opt/dockstore-verification/data" ]
VOLUME [ "/opt/dockstore-verification/public" ]

COPY ./dist/index.js .
COPY ./public ./public

EXPOSE 3100/tcp
ENTRYPOINT [ "bun", "run", "--bun", "index.js" ]
