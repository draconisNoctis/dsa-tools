ARG NODE_VERSION="22"
ARG NODE_ALPINE_VERSION="22"

FROM node:${NODE_VERSION} AS base 
WORKDIR /source
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS install
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches
RUN ls -lah
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm build

FROM node:${NODE_ALPINE_VERSION} AS server
ENV STORAGE_DIR="/data/storage"
ENV DATA_DIR="/data/data"
VOLUME [ "/data/storage", "/data/data" ]
WORKDIR /app

RUN mkdir -p /data/storage
RUN mkdir -p /data/data

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 vinxi

RUN chown vinxi:nodejs /data/storage
RUN chown vinxi:nodejs /data/data

USER vinxi

COPY --from=install --chown=vinxi:nodejs /source /app
COPY --from=build --chown=vinxi:nodejs /source/.output /app/.output
CMD ["npm", "start"]

