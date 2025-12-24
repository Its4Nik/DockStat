FROM oven/bun:latest AS base
WORKDIR /opt/dockstore-verification
VOLUME [ "/opt/dockstore-verification/data" ]
VOLUME [ "/opt/dockstore-verification/public" ]

COPY ./dist/index.js .
COPY ./public ./public

ENV VERIFICATION_DB_PATH=data/verification.db

EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "--bun", "index.js" ]
