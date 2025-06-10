# 🌤️ MCP Weather Server + n8n

Serveur MCP (Model Context Protocol) pour la météo avec plateforme d'automatisation n8n intégrée.

## ✨ Fonctionnalités

### Serveur MCP Weather
- **get_weather** : Météo actuelle par nom de ville
- **get_weather_forecast** : Prévisions sur 5 jours 
- **get_weather_by_coordinates** : Météo par coordonnées GPS
- Support multilingue (français, anglais, espagnol, etc.)
- API Open-Meteo gratuite (pas de clé API requise)

### n8n - Automatisation
- Interface web intuitive pour créer des workflows
- Intégration avec le serveur MCP Weather
- Plus de 300 intégrations disponibles
- Automatisation de tâches et notifications

## 🚀 Installation rapide

### Prérequis
- Docker et Docker Compose
- Traefik configuré avec réseau externe "traefik"

### Démarrage
```bash
# Cloner le projet
git clone <repo-url>
cd mcp

# Rendre le script exécutable
chmod +x deploy.sh

# Déployer avec Traefik
./deploy.sh
```

## 🌐 Accès aux services

- **Serveur MCP Weather** : https://mcp-weather.top-exo.fr
- **Interface n8n** : https://n8n.top-exo.fr
- **Identifiants n8n** : admin / changeMe123!

## 📡 API REST Endpoints

| Endpoint | Méthode | Description | Exemple |
|----------|---------|-------------|---------|
| `/health` | GET | Santé du serveur | - |
| `/api/weather` | POST | Météo actuelle | `{"city": "Paris"}` |
| `/api/forecast` | POST | Prévisions | `{"city": "Lyon", "days": 5}` |
| `/api/coordinates` | POST | Météo par GPS | `{"lat": 48.8566, "lon": 2.3522}` |

## 🔧 Configuration MCP

```json
{
  "mcpServers": {
    "weather": {
      "command": "node",
      "args": ["/chemin/vers/mcp-weather/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## 🔄 Intégration n8n

1. Accéder à https://n8n.top-exo.fr 
2. Se connecter avec admin / changeMe123!
3. Importer le workflow d'exemple : `n8n-workflows/meteo-quotidienne.json`
4. Configurer les URLs vers https://mcp-weather.top-exo.fr
5. Activer le workflow

## 🛠️ Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer les services
docker-compose restart

# Arrêter les services
docker-compose down

# Reconstruire
docker-compose build --no-cache

# Status des services
docker-compose ps
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Traefik     │────│  MCP Weather    │────│   Open-Meteo    │
│   (Reverse      │    │    Server       │    │      API        │
│    Proxy)       │    │  :3000 (int)    │    │   (Gratuite)    │
│   :80/:443      │    └─────────────────┘    └─────────────────┘
│                 │             │
│ *.top-exo.fr    │    ┌─────────────────┐
│                 │────│       n8n       │
│                 │    │  :5678 (int)    │
└─────────────────┘    │  (Automation)   │
                       └─────────────────┘
```

## 📊 Outils MCP disponibles

1. **get_weather** : Météo actuelle par nom de ville
2. **get_weather_forecast** : Prévisions météorologiques  
3. **get_weather_by_coordinates** : Météo par coordonnées GPS

## 🔒 Sécurité

- Traefik avec certificats SSL automatiques (Let's Encrypt)
- Authentification basique sur n8n (changez le mot de passe!)
- Réseau Docker isolé pour la communication inter-services
- Pas d'exposition directe des ports sur l'hôte

## 📝 Notes

- Les certificats SSL sont gérés automatiquement par Traefik
- Le serveur MCP Weather utilise l'API Open-Meteo gratuite
- Les workflows n8n sont sauvegardés dans le volume `n8n_data`
- Pensez à modifier le mot de passe par défaut de n8n
