# ---- Stage 1: Build the Vite app ----
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* bun.lockb* ./
RUN npm install --frozen-lockfile || npm install
# Copy source and build
COPY . .
ARG VITE_MONGO_PROXY_URL=/api
ENV VITE_MONGO_PROXY_URL=$VITE_MONGO_PROXY_URL
RUN npm run build

# ---- Stage 2: Serve with nginx ----
FROM nginx:alpine AS production

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# SPA fallback + reverse proxy /api to proxy-server
RUN printf 'server {\n\
  listen 80;\n\
  server_name localhost;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location /api/ {\n\
    proxy_pass http://proxy-server:3000/;\n\
    proxy_set_header Host $host;\n\
    proxy_set_header X-Real-IP $remote_addr;\n\
  }\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
