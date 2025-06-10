#!/bin/bash

# Script de déploiement en mode développement (sans API réelle)

echo "🧪 Déploiement en mode développement"
echo "=================================="

# Vérifier que l'image se construit correctement
echo "🔨 Construction de l'image Docker..."
if docker build -t mcp-weather-server-dev .; then
    echo "✅ Image Docker construite avec succès"
else
    echo "❌ Erreur lors de la construction de l'image"
    exit 1
fi

# Test de base du conteneur
echo "🧪 Test du conteneur..."
if docker run --rm -e WEATHER_API_KEY=test_key mcp-weather-server-dev node -e "console.log('✅ Conteneur fonctionnel')"; then
    echo "✅ Conteneur peut démarrer correctement"
else
    echo "❌ Problème avec le conteneur"
    exit 1
fi

echo ""
echo "🎉 Tests de développement réussis !"
echo ""
echo "📋 Prochaines étapes pour la production:"
echo "   1. Obtenez une clé API sur https://openweathermap.org/api"
echo "   2. Modifiez le fichier .env avec votre vraie clé API"
echo "   3. Lancez: ./deploy.sh"
echo ""
echo "💡 Pour tester avec Docker Compose:"
echo "   docker compose up -d"
