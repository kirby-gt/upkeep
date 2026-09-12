# Built from the repo root so npm workspaces resolve correctly:
#   docker build -f apps/api/Dockerfile .
# (docker-compose.prod.yml sets this context/dockerfile automatically.)
FROM node:22-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install
COPY apps/api apps/api
WORKDIR /app/apps/api
EXPOSE 8787
CMD ["npx", "tsx", "src/index.ts"]
