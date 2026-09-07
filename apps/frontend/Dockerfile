FROM oven/bun:1 AS build
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build

FROM oven/bun:1
WORKDIR /app
COPY --from=build /app .
EXPOSE 3000
CMD ["bun", "run", "start"]
