#!/bin/bash

# Script pour tester Docker et Docker Compose

echo "🔍 Test de Docker et Docker Compose"
echo "===================================="

# Test Docker
echo "🐳 Test de Docker..."
if command -v docker &> /dev/null; then
    echo "✅ Docker installé"
    docker --version
else
    echo "❌ Docker non installé"
    exit 1
fi

# Test Docker Compose (nouvelle syntaxe)
echo ""
echo "🔧 Test de Docker Compose (syntaxe moderne)..."
if docker compose version &> /dev/null; then
    echo "✅ Docker Compose disponible avec: docker compose"
    docker compose version
    COMPOSE_CMD="docker compose"
else
    echo "❌ 'docker compose' non disponible"
fi

# Test Docker Compose (ancienne syntaxe)
echo ""
echo "🔧 Test de Docker Compose (syntaxe legacy)..."
if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose disponible avec: docker-compose"
    docker-compose --version
    COMPOSE_CMD="docker-compose"
else
    echo "❌ 'docker-compose' non disponible"
fi

if [ -z "$COMPOSE_CMD" ]; then
    echo ""
    echo "❌ Aucune version de Docker Compose trouvée"
    echo "📋 Solutions possibles:"
    echo "   1. Installer Docker Desktop (inclut Docker Compose)"
    echo "   2. Installer docker-compose: sudo apt install docker-compose"
    echo "   3. Mettre à jour Docker vers une version récente"
    exit 1
else
    echo ""
    echo "✅ Docker Compose fonctionnel avec: $COMPOSE_CMD"
    echo ""
    echo "🚀 Vous pouvez maintenant lancer le déploiement:"
    echo "   ./deploy.sh"
fi
