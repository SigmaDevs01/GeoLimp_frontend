# ==============================================================================
# GeoLimp Frontend - Production Dockerfile (React + Vite + Nginx Alpine)
# ==============================================================================

# Stage 1: Build da aplicação React/Vite
FROM node:22-alpine AS builder

WORKDIR /app

# Copia manifestos de dependências
COPY package*.json ./

# Instala dependências de forma determinística
RUN npm ci

# Copia o código-fonte
COPY . .

# Variável de build para apontar a URL da API backend (pode ser sobrescrita no build)
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Executa o build de produção (gera a pasta /app/dist)
RUN npm run build

# ==============================================================================
# Stage 2: Servidor Nginx ultra-leve para produção
# ==============================================================================
FROM nginx:alpine AS runner

# Remove a configuração padrão do Nginx
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia a configuração customizada do Nginx com suporte a SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do frontend
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
