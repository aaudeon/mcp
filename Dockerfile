# Dockerfile optimisé pour la production
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer UNIQUEMENT les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Copier le code source
COPY src/ ./src/

# Construire l'application
RUN npm run build

# Image de production
FROM node:20-alpine AS production

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcpuser -u 1001

# Copier les dépendances de production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Variables d'environnement
ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

# Changer la propriété des fichiers
RUN chown -R mcpuser:nodejs /app
USER mcpuser

# Healthcheck léger
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check OK')" || exit 1

# Commande de démarrage
CMD ["npm", "start"]
