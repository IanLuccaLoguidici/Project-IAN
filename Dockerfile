FROM node:20-alpine AS base

WORKDIR /usr/src/app

RUN apk add --no-cache bash

FROM base AS deps

COPY package*.json ./

RUN npm ci

FROM base AS builder

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
