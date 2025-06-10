#!/bin/bash

# Script de déploiement automatique pour MCP Weather Server

set -e

echo "🌤️  Déploiement du serveur MCP Weather"
echo "=================================="

# Vérification des prérequis
echo "📋 Vérification des prérequis..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker."
    exit 1
fi

# Fonction pour détecter la commande Docker Compose
get_docker_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    elif docker compose version &> /dev/null; then
        echo "docker compose"
    else
        return 1
    fi
}

# Vérification de Docker Compose
DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)
if [ $? -ne 0 ]; then
    echo "❌ Docker Compose n'est pas disponible."
    echo "   - Sur les nouvelles versions de Docker: utilisez 'docker compose'"
    echo "   - Sur les anciennes versions: installez docker-compose"
    exit 1
fi

echo "✅ Docker Compose détecté: $DOCKER_COMPOSE_CMD"
echo "✅ Prérequis vérifiés"

# Vérification du fichier .env
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé. Copie du fichier exemple..."
    cp .env.example .env
    echo "📝 Veuillez éditer le fichier .env et ajouter votre clé API OpenWeatherMap."
    echo "   Ensuite, relancez ce script."
    exit 1
fi

# Vérification de la clé API
if ! grep -q "WEATHER_API_KEY=.*[a-zA-Z0-9]" .env; then
    echo "❌ Clé API OpenWeatherMap manquante dans .env"
    echo "   Veuillez ajouter votre clé API : WEATHER_API_KEY=votre_clé"
    exit 1
fi

echo "✅ Prérequis vérifiés"

# Arrêt des conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
$DOCKER_COMPOSE_CMD down 2>/dev/null || echo "Aucun conteneur à arrêter"

# Construction et lancement
echo "🔨 Construction de l'image Docker..."
$DOCKER_COMPOSE_CMD build --no-cache

echo "🚀 Lancement des services..."
$DOCKER_COMPOSE_CMD up -d

# Vérification du déploiement
echo "🔍 Vérification du déploiement..."
sleep 5

if $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    echo "✅ Serveur MCP Weather déployé avec succès!"
    echo ""
    echo "📊 Status des conteneurs:"
    $DOCKER_COMPOSE_CMD ps
    echo ""
    echo "📝 Pour voir les logs:"
    echo "   $DOCKER_COMPOSE_CMD logs -f mcp-weather-server"
    echo ""
    echo "🛑 Pour arrêter:"
    echo "   $DOCKER_COMPOSE_CMD down"
else
    echo "❌ Erreur lors du déploiement"
    echo "📋 Logs d'erreur:"
    $DOCKER_COMPOSE_CMD logs
    exit 1
fi
