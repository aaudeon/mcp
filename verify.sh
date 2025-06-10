#!/bin/bash

# Script de vérification complète du projet MCP Weather Server

echo "🔍 Vérification du Projet MCP Weather Server"
echo "============================================="

errors=0
warnings=0

# Fonction pour afficher les erreurs
error() {
    echo "❌ ERREUR: $1"
    ((errors++))
}

# Fonction pour afficher les avertissements
warning() {
    echo "⚠️  ATTENTION: $1" 
    ((warnings++))
}

# Fonction pour afficher les succès
success() {
    echo "✅ $1"
}

# Vérification des fichiers essentiels
echo "📁 Vérification de la structure des fichiers..."

files_to_check=(
    "package.json"
    "tsconfig.json" 
    "Dockerfile"
    "docker-compose.yml"
    ".env.example"
    "src/index.ts"
    "README.md"
    "GETTING_STARTED.md"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        success "Fichier $file présent"
    else
        error "Fichier $file manquant"
    fi
done

# Vérification de la compilation TypeScript
echo ""
echo "🔨 Vérification de la compilation..."
if npm run build > /dev/null 2>&1; then
    success "Compilation TypeScript réussie"
else
    error "Échec de la compilation TypeScript"
fi

# Vérification des dépendances
echo ""
echo "📦 Vérification des dépendances..."
if [ -d "node_modules" ]; then
    success "Dépendances installées"
else
    error "Dépendances manquantes (exécutez: npm install)"
fi

# Vérification du fichier .env
echo ""
echo "🔧 Vérification de la configuration..."
if [ -f ".env" ]; then
    if grep -q "WEATHER_API_KEY=.*[a-zA-Z0-9]" .env && ! grep -q "your_openweathermap_api_key_here" .env; then
        success "Fichier .env configuré avec une clé API"
    else
        warning "Fichier .env présent mais clé API non configurée"
    fi
else
    warning "Fichier .env manquant (copiez .env.example vers .env)"
fi

# Vérification de Docker
echo ""
echo "🐳 Vérification de Docker..."
if command -v docker &> /dev/null; then
    success "Docker installé"
    
    if command -v docker-compose &> /dev/null; then
        success "Docker Compose installé (version standalone)"
    elif docker compose version &> /dev/null; then
        success "Docker Compose installé (intégré à Docker)"
    else
        warning "Docker Compose non disponible"
    fi
else
    warning "Docker non installé"
fi

# Vérification de la structure du code
echo ""
echo "📝 Vérification du code source..."
if grep -q "Weather MCP server running" src/index.ts; then
    success "Code principal du serveur MCP présent"
else
    error "Code principal du serveur MCP manquant ou incorrect"
fi

if grep -q "get_weather" src/index.ts; then
    success "Outil get_weather implémenté"
else
    error "Outil get_weather manquant"
fi

if grep -q "get_weather_forecast" src/index.ts; then
    success "Outil get_weather_forecast implémenté"
else
    error "Outil get_weather_forecast manquant"
fi

if grep -q "get_weather_by_coordinates" src/index.ts; then
    success "Outil get_weather_by_coordinates implémenté"
else
    error "Outil get_weather_by_coordinates manquant"
fi

# Vérification des scripts
echo ""
echo "⚙️  Vérification des scripts..."
if [ -x "deploy.sh" ]; then
    success "Script de déploiement exécutable"
else
    warning "Script de déploiement non exécutable (exécutez: chmod +x deploy.sh)"
fi

if [ -x "test.sh" ]; then
    success "Script de test exécutable"
else
    warning "Script de test non exécutable (exécutez: chmod +x test.sh)"
fi

# Résumé final
echo ""
echo "📊 RÉSUMÉ DE LA VÉRIFICATION"
echo "============================"

if [ $errors -eq 0 ]; then
    if [ $warnings -eq 0 ]; then
        echo "🎉 PARFAIT! Le projet est entièrement configuré et prêt à l'emploi."
        echo ""
        echo "🚀 Prochaines étapes:"
        echo "   1. Copiez .env.example vers .env (si pas déjà fait)"
        echo "   2. Ajoutez votre clé API OpenWeatherMap dans .env"
        echo "   3. Lancez: ./deploy.sh"
        echo "   4. Testez: ./test.sh"
    else
        echo "⚠️  Le projet est fonctionnel mais avec $warnings avertissement(s)."
        echo "   Consultez les messages ci-dessus pour optimiser votre configuration."
    fi
else
    echo "❌ Le projet a $errors erreur(s) qui doivent être corrigées."
    echo "   Consultez les messages d'erreur ci-dessus."
fi

echo ""
echo "📚 Pour plus d'informations:"
echo "   - Lisez GETTING_STARTED.md pour le guide de démarrage"
echo "   - Consultez README.md pour la documentation complète"
echo "   - Exécutez ./deploy.sh pour un déploiement automatique"

exit $errors
