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

FROM base AS prod-deps

COPY package*.json ./

RUN npm ci --omit=dev

FROM node:20-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY package*.json ./

# Create the uploads directory and give permissions to the node user
RUN mkdir -p /usr/src/app/uploads/todos && chown -R node:node /usr/src/app/uploads

USER node

EXPOSE 3000

CMD ["node", "dist/main"]
