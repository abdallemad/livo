# syntax=docker/dockerfile:1.7
# Multi-stage build (CLAUDE.md §10). Secrets come in as a BuildKit secret, so
# the .env file is used during `npm run build` but never stored in an image layer:
#   docker build --secret id=env,src=.env -t livo-app .

FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN --mount=type=secret,id=env,required=true \
    set -a && . /run/secrets/env && set +a && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder /app/.next/standalone ./.next/standalone
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
