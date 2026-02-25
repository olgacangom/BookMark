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

# 3. Copiamos como DUEÑO root y permisos 755 (seguridad de archivos)
# Esto evita que el usuario 'node' pueda modificar su propio código.
COPY --from=builder --chown=root:root --chmod=755 /app/package*.json ./
COPY --from=builder --chown=root:root --chmod=755 /app/node_modules ./node_modules
COPY --from=builder --chown=root:root --chmod=755 /app/dist ./dist

EXPOSE 3000
CMD ["npm", "run", "start:prod"]