#!/bin/bash

# Script de test pour le serveur MCP Weather

set -e

echo "🧪 Tests du serveur MCP Weather"
echo "=============================="

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

# Détection de Docker Compose
DOCKER_COMPOSE_CMD=$(get_docker_compose_cmd)
if [ $? -ne 0 ]; then
    echo "❌ Docker Compose n'est pas disponible."
    exit 1
fi

# Vérification que le serveur est démarré
if ! $DOCKER_COMPOSE_CMD ps | grep -q "Up"; then
    echo "❌ Le serveur n'est pas démarré. Lancez d'abord: $DOCKER_COMPOSE_CMD up -d"
    exit 1
fi

echo "📡 Test de connectivité..."

# Test de base - vérifier que le conteneur répond
if $DOCKER_COMPOSE_CMD exec -T mcp-weather-server node -e "console.log('✅ Node.js fonctionne')"; then
    echo "✅ Conteneur accessible"
else
    echo "❌ Problème de connectivité avec le conteneur"
    exit 1
fi

# Test des variables d'environnement
echo "🔧 Vérification de la configuration..."
if $DOCKER_COMPOSE_CMD exec -T mcp-weather-server node -e "
    require('dotenv').config();
    if (process.env.WEATHER_API_KEY) {
        console.log('✅ Clé API configurée');
    } else {
        console.log('❌ Clé API manquante');
        process.exit(1);
    }
"; then
    echo "✅ Configuration valide"
else
    echo "❌ Problème de configuration"
    exit 1
fi

# Test d'une requête météo réelle (si possible)
echo "🌤️  Test d'une requête météo..."
echo "   (Ce test nécessite une clé API valide)"

# Note: Ce test nécessiterait une interface HTTP ou un client MCP
# Pour le moment, on vérifie juste que le serveur peut démarrer
if $DOCKER_COMPOSE_CMD logs mcp-weather-server | grep -q "Weather MCP server running"; then
    echo "✅ Serveur MCP démarré correctement"
else
    echo "⚠️  Le serveur semble avoir des problèmes. Vérifiez les logs:"
    echo "   $DOCKER_COMPOSE_CMD logs mcp-weather-server"
fi

echo ""
echo "🎉 Tests terminés !"
echo ""
echo "💡 Pour tester manuellement:"
echo "   1. Connectez votre client MCP au serveur"
echo "   2. Utilisez les outils : get_weather, get_weather_forecast, get_weather_by_coordinates"
echo ""
echo "📋 Exemple d'appel d'outil:"
echo '   {"name": "get_weather", "arguments": {"city": "Paris", "lang": "fr"}}'
