#!/bin/bash

echo "🚀 Déploiement de la stack MCP Weather + n8n avec Traefik"

# Vérification de Docker et Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    exit 1
fi

# Vérification de Docker Compose (v2 ou v1)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

# Utilisation de la commande appropriée
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
else
    COMPOSE_CMD="docker compose"
fi

echo "✅ Utilisation de : $COMPOSE_CMD"

# Vérification du réseau Traefik
if ! docker network ls | grep -q "traefik"; then
    echo "❌ Le réseau Traefik n'existe pas. Assurez-vous que Traefik est installé et configuré."
    exit 1
fi

# Création des répertoires nécessaires
mkdir -p logs n8n-workflows

# Création du fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "NODE_ENV=production" > .env
    echo "PORT=3000" >> .env
    echo "✅ Fichier .env créé"
fi

# Construction et démarrage des services
echo "🔧 Construction et démarrage des services..."
$COMPOSE_CMD down --remove-orphans
$COMPOSE_CMD build --no-cache
$COMPOSE_CMD up -d

# Attente que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérification des services
echo "🔍 Vérification des services..."

if $COMPOSE_CMD ps | grep -q "Up"; then
    echo "✅ Services démarrés avec succès !"
    echo ""
    echo "🌐 Accès aux services :"
    echo "   • MCP Weather Server: https://mcp-weather.top-exo.fr"
    echo "   • n8n Interface:      https://n8n.top-exo.fr"
    echo "   • Identifiants n8n:   admin / changeMe123!"
    echo ""
    echo "📝 Logs en temps réel :"
    echo "   $COMPOSE_CMD logs -f"
    echo ""
    echo "🔧 Pour intégrer le serveur MCP Weather dans n8n :"
    echo "   URL de base: https://mcp-weather.top-exo.fr"
    echo "   Endpoints disponibles:"
    echo "     - GET /health (santé du serveur)"
    echo "     - POST /api/weather (météo par ville)"
    echo "     - POST /api/forecast (prévisions)"
    echo "     - POST /api/coordinates (météo par coordonnées)"
else
    echo "❌ Erreur lors du démarrage des services"
    $COMPOSE_CMD logs
    exit 1
fi
