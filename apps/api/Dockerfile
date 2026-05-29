FROM node:22-alpine AS base
WORKDIR /repo
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @superhostos/shared build
RUN pnpm --filter @superhostos/db build
RUN pnpm --filter @superhostos/api build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable
COPY --from=deps /repo/node_modules /app/node_modules
COPY --from=build /repo/apps/api/dist /app/dist
COPY apps/api/package.json /app/package.json
EXPOSE 4000
CMD ["node", "dist/index.js"]
