# Etapa de construcción
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY src/ ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./
RUN npm run build

# Etapa de producción
FROM node:20-alpine
WORKDIR /app

# 1. Damos permisos de la carpeta de trabajo al usuario 'node'
RUN chown node:node /app

# 2. Cambiamos al usuario 'node' para que no use root
USER node

# 3. Copiamos los archivos asegurando que el dueño sea el usuario 'node'
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

EXPOSE 3000
CMD ["npm", "run", "start:prod"]