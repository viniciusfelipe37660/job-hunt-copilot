# Build context is the repo root (see infra/docker/docker-compose.yml).

FROM node:24-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /repo
COPY --from=deps /repo ./
COPY . .
RUN npm run prisma:generate -w api
RUN npm run build -w api

FROM node:24-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci --omit=dev
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/packages/shared-types ./packages/shared-types

WORKDIR /repo/apps/api
EXPOSE 3001
CMD ["node", "dist/main.js"]
