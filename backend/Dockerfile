# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-alpine

# --- Everything needed to build -------------------------------------------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Compile, and generate the Prisma client ------------------------------
FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `prisma generate` reads the datasource through prisma.config.ts and refuses
# to run without it. Generating opens no connection, so a placeholder is
# enough and no database is needed to build an image.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public
RUN npm run db:generate && npm run build

# --- What actually ships ---------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Signals: Node as PID 1 does not reap children or forward SIGTERM, so a
# container stop would wait out the grace period instead of shutting down.
RUN apk add --no-cache tini

# Copy node_modules from build stage so Prisma CLI and all its dependencies
# (effect, @prisma/config, etc.) are present and self-contained for db:deploy.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./
COPY --chown=node:node package.json ./

USER node
EXPOSE 4000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
