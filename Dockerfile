# Utiliser une image Node.js alpine pour un conteneur léger
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration des dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY src/ ./src/

# Construire l'application TypeScript
RUN npm run build

# Exposer le port (optionnel pour MCP via stdio)
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mcpuser -u 1001

# Changer la propriété des fichiers
RUN chown -R mcpuser:nodejs /app
USER mcpuser

# Commande par défaut pour démarrer le serveur
CMD ["npm", "start"]
