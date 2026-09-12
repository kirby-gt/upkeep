# Built from the repo root so npm workspaces resolve correctly:
#   docker build -f apps/web/Dockerfile .
# (docker-compose.prod.yml sets this context/dockerfile automatically.)
#
# No VITE_API_URL build arg needed — api.ts already calls same-origin
# `/api/...` paths, and Traefik routes /api straight to the api container
# without stripping the prefix (Hono itself mounts routes under /api).
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm install
COPY apps/web apps/web
WORKDIR /app/apps/web
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
