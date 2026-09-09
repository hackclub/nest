FROM docker.io/oven/bun:1.3 AS build

WORKDIR /app
COPY . .

RUN bun install --frozen-lockfile

WORKDIR /app/backend

RUN bun run build

WORKDIR /app/frontend

RUN bun run build

FROM docker.io/oven/bun:1.3-alpine AS base

EXPOSE 3000

FROM base as backend

EXPOSE 3001

COPY --from=build /app/backend/dist /app

WORKDIR /app

CMD ["run", "--sql-preconnect", "./index.js"]

FROM docker.io/oven/bun:1.3-alpine as migrate

WORKDIR /app

COPY --from=build /app /app
WORKDIR /app/backend

CMD ["run","db:migrate"]

FROM base as frontend

COPY --from=build /app/frontend/build /app

WORKDIR /app

CMD ["run","./index.js"]
