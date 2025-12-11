# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia código fonte
COPY . .

# Compila TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copia apenas arquivos necessários
COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Porta padrão
EXPOSE 3002

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3002
ENV HOST=0.0.0.0

# Comando de inicialização
CMD ["node", "dist/server.js"]

