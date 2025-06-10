#!/bin/bash

set -e

echo "🚀 Déploiement du serveur MCP Weather optimisé"

# Vérifications préalables
check_dependencies() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker n'est pas installé"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
        echo "❌ Docker Compose n'est pas installé"
        exit 1
    fi

    # Déterminer la commande Docker Compose à utiliser
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    echo "✅ Utilisation de : $COMPOSE_CMD"
}

# Création du fichier .env si nécessaire
setup_env() {
    if [ ! -f .env ]; then
        echo "📝 Création du fichier .env à partir de .env.example"
        cp .env.example .env
        echo "⚠️  Pensez à modifier .env si nécessaire"
    else
        echo "✅ Fichier .env existant"
    fi
}

# Nettoyage et construction
build_and_deploy() {
    echo "🧹 Nettoyage des anciens conteneurs..."
    $COMPOSE_CMD down --remove-orphans

    echo "🔧 Construction de l'image..."
    $COMPOSE_CMD build --no-cache

    echo "🚀 Démarrage du serveur..."
    $COMPOSE_CMD up -d

    echo "⏳ Vérification du statut..."
    sleep 10
    
    if $COMPOSE_CMD ps | grep -q "Up"; then
        echo "✅ Serveur MCP Weather déployé avec succès!"
        echo "📋 Status:"
        $COMPOSE_CMD ps
    else
        echo "❌ Erreur lors du déploiement"
        echo "📋 Logs:"
        $COMPOSE_CMD logs
        exit 1
    fi
}

# Affichage des informations post-déploiement
show_info() {
    echo ""
    echo "� Informations utiles:"
    echo "  - Voir les logs: $COMPOSE_CMD logs -f"
    echo "  - Arrêter: $COMPOSE_CMD down"
    echo "  - Redémarrer: $COMPOSE_CMD restart"
    echo "  - Status: $COMPOSE_CMD ps"
    echo ""
    echo "🔧 Le serveur MCP est prêt à être utilisé via stdio"
}

# Exécution du déploiement
main() {
    check_dependencies
    setup_env
    build_and_deploy
    show_info
}

main "$@"

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
