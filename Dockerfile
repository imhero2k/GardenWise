FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY scripts ./scripts
COPY index.html home.html vite.config.ts tsconfig*.json ./
COPY src ./src
COPY public ./public

RUN npm run build

FROM nginx:alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
RUN apk add --no-cache jq
COPY --chmod=755 docker/runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
