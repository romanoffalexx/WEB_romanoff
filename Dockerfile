# ── Этап 1: сборка ──
# v2.0 - SEO + LinkedIn + flip cards
FROM node:20-alpine AS build
WORKDIR /app

# Сначала зависимости для кэширования слоя
COPY package.json package-lock.json ./
RUN npm ci

# Затем исходники
COPY tsconfig.json vite.config.ts postcss.config.js tailwind.config.js ./
COPY client ./client
RUN npm run build

# ── Этап 2: раздача статики через nginx ──
FROM nginx:alpine
# Копируем собранный dist
COPY --from=build /app/dist /usr/share/nginx/html
# SPA-fallback: все пути → index.html
RUN printf 'server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
\n\
    gzip on;\n\
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;\n\
\n\
    # Долгий кэш для ассетов с хэшем\n\
    location /assets/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
