# Serveur MCP Weather

> Serveur Model Context Protocol (MCP) fournissant des informations météorologiques en temps réel via l'API Open-Meteo.

## ✨ Fonctionnalités

- 🌤️ **Météo actuelle** par nom de ville ou coordonnées
- 📅 **Prévisions** jusqu'à 7 jours
- 🌍 **Support multilingue** (français, anglais, espagnol, allemand, etc.)
- 🆓 **API gratuite** Open-Meteo (sans clé requise)
- 🐳 **Prêt pour Docker** avec configuration de production optimisée
- 📊 **TypeScript strict** avec validation des paramètres

## 🚀 Installation et démarrage rapide

### Prérequis
- Node.js 18+ 
- Docker et Docker Compose (optionnel)

### Méthode 1: Démarrage local
```bash
# Installation des dépendances
npm install

# Construction
npm run build

# Démarrage
npm start
```

### Méthode 2: Docker (recommandé pour production)
```bash
# Déploiement automatique
chmod +x deploy.sh
./deploy.sh
```

## 📋 Outils MCP disponibles

### `get_weather`
Obtient la météo actuelle pour une ville.
```json
{
  "city": "Paris",
  "countryCode": "FR",
  "lang": "fr"
}
```

### `get_weather_forecast` 
Obtient les prévisions météo (1-7 jours).
```json
{
  "city": "London",
  "days": 5,
  "lang": "en"
}
```

### `get_weather_by_coordinates`
Obtient la météo par coordonnées GPS.
```json
{
  "latitude": 48.8566,
  "longitude": 2.3522,
  "lang": "fr"
}
```

## ⚙️ Configuration

Copiez `.env.example` vers `.env` et ajustez si nécessaire :

```bash
# Port du serveur (optionnel)
MCP_SERVER_PORT=3000

# Langue par défaut
DEFAULT_LANGUAGE=fr

# Environnement
NODE_ENV=production
```

## 🛠️ Développement

```bash
# Mode développement avec rechargement automatique
npm run dev

# Vérification du code
npm run lint
npm run typecheck

# Formatage du code
npm run format
```

## 📦 Structure du projet

```
src/
├── index.ts              # Point d'entrée principal
├── services/
│   └── weatherService.ts # Service API Open-Meteo
├── utils/
│   ├── formatter.ts      # Formatage des réponses
│   └── validation.ts     # Validation des paramètres
├── types/
│   └── weather.ts        # Types TypeScript
└── constants/
    └── weather.ts        # Constantes et configurations
```

## 🐳 Production avec Docker

Le projet inclut une configuration Docker optimisée avec :
- Build multi-stage pour une image légère
- Utilisateur non-root pour la sécurité
- Healthchecks intégrés
- Logs structurés

```bash
# Construction manuelle
docker build -t mcp-weather-server .

# Ou via docker-compose
docker-compose up -d
```

## 🔧 Intégration MCP

Ce serveur est compatible avec tous les clients MCP. Exemple d'utilisation avec Claude Desktop :

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/chemin/vers/dist/index.js"]
    }
  }
}
```

## 📄 License

MIT - Voir le fichier LICENSE pour plus de détails.

---

**Développé avec ❤️ en TypeScript**
