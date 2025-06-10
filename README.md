# 🌤️ Serveur MCP Weather

Un serveur MCP (Model Context Protocol) complet pour fournir des informations météorologiques en temps réel à vos assistants IA.

## ✨ Fonctionnalités

- **3 outils météo complets** :
  - `get_weather` : Météo actuelle par nom de ville
  - `get_weather_forecast` : Prévisions sur 5 jours 
  - `get_weather_by_coordinates` : Météo par coordonnées GPS

- **Support multilingue** : Français, anglais, espagnol, allemand, etc.
- **Données précises** : Température, humidité, pression, vent, visibilité
- **Déploiement conteneurisé** : Docker + Docker Compose prêt pour la production
- **Configuration flexible** : Variables d'environnement
- **Proxy Nginx** : Pour exposition sécurisée

- **Météo actuelle** : Obtenez les conditions météorologiques actuelles pour n'importe quelle ville
- **Prévisions 5 jours** : Consultez les prévisions météorologiques détaillées
- **Recherche par coordonnées** : Utilisez la latitude et longitude pour obtenir la météo
- **Support multilingue** : Descriptions disponibles en français, anglais, espagnol, etc.
- **Unités flexibles** : Métrique (Celsius), Impérial (Fahrenheit), ou Kelvin
- **Containerisé avec Docker** : Déploiement facile et portable

## 🛠️ Installation

### Prérequis

1. **Clé API OpenWeatherMap** : 
   - Inscrivez-vous sur [OpenWeatherMap](https://openweathermap.org/api)
   - Obtenez votre clé API gratuite

2. **Docker et Docker Compose** (recommandé) ou Node.js 20+

### Configuration

1. **Clonez le projet** :
   ```bash
   git clone <url-du-repo>
   cd mcp-weather-server
   ```

2. **Configurez les variables d'environnement** :
   ```bash
   cp .env.example .env
   ```
   
   Éditez le fichier `.env` et ajoutez votre clé API :
   ```env
   WEATHER_API_KEY=votre_clé_api_openweathermap
   ```

### 🐳 Déploiement avec Docker (Recommandé)

1. **Construction et lancement** :
   ```bash
   docker-compose up -d
   ```

2. **Vérification** :
   ```bash
   docker-compose logs -f mcp-weather-server
   ```

### 🔧 Déploiement manuel

1. **Installation des dépendances** :
   ```bash
   npm install
   ```

2. **Construction** :
   ```bash
   npm run build
   ```

3. **Lancement** :
   ```bash
   npm start
   ```

## 📡 Utilisation avec un LLM

Le serveur MCP expose trois outils principaux :

### 1. `get_weather`
Obtient la météo actuelle pour une ville.

**Paramètres** :
- `city` (requis) : Nom de la ville
- `country` (optionnel) : Code pays (FR, US, GB, etc.)
- `units` (optionnel) : metric, imperial, ou kelvin
- `lang` (optionnel) : Langue (fr, en, es, etc.)

**Exemple** :
```json
{
  "name": "get_weather",
  "arguments": {
    "city": "Paris",
    "country": "FR",
    "units": "metric",
    "lang": "fr"
  }
}
```

### 2. `get_weather_forecast`
Obtient les prévisions sur 5 jours.

**Paramètres** : Identiques à `get_weather`

### 3. `get_weather_by_coordinates`
Obtient la météo par coordonnées GPS.

**Paramètres** :
- `lat` (requis) : Latitude
- `lon` (requis) : Longitude
- `units` (optionnel) : metric, imperial, ou kelvin
- `lang` (optionnel) : Langue

**Exemple** :
```json
{
  "name": "get_weather_by_coordinates",
  "arguments": {
    "lat": 48.8566,
    "lon": 2.3522,
    "units": "metric",
    "lang": "fr"
  }
}
```

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|---------|
| `WEATHER_API_KEY` | Clé API OpenWeatherMap | *Requis* |
| `WEATHER_API_URL` | URL de base de l'API | `https://api.openweathermap.org/data/2.5` |
| `MCP_SERVER_PORT` | Port du serveur | `3000` |
| `DEFAULT_LANGUAGE` | Langue par défaut | `fr` |
| `DEFAULT_UNITS` | Unités par défaut | `metric` |

### Personnalisation Docker

Pour personnaliser l'image Docker :

```dockerfile
# Construction personnalisée
docker build -t mon-mcp-weather --build-arg NODE_VERSION=18 .

# Avec variables d'environnement
docker run -e WEATHER_API_KEY=ma_clé -p 3000:3000 mon-mcp-weather
```

## 🧪 Tests et développement

### Mode développement
```bash
npm run dev
```

### Construction
```bash
npm run build
```

### Tests Docker locaux
```bash
# Construction
docker build -t mcp-weather-test .

# Test de fonctionnement
docker run --rm -e WEATHER_API_KEY=votre_clé mcp-weather-test
```

## 📊 Monitoring et Logs

### Logs Docker
```bash
# Logs en temps réel
docker-compose logs -f mcp-weather-server

# Logs avec limite
docker-compose logs --tail=100 mcp-weather-server
```

### Santé du conteneur
```bash
# Status des conteneurs
docker-compose ps

# Ressources utilisées
docker stats mcp-weather-server
```

## 🔒 Sécurité

- Le conteneur utilise un utilisateur non-root
- Variables d'environnement pour les secrets
- Pas d'exposition de ports non nécessaires
- Image Alpine légère pour réduire la surface d'attaque

## 🤝 Intégration avec les LLMs

### Claude (Anthropic)
```json
{
  "mcpServers": {
    "weather": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--env-file", ".env", "mcp-weather-server"]
    }
  }
}
```

### ChatGPT (OpenAI)
Utilisez ce serveur MCP avec les plugins ChatGPT ou intégrations personnalisées.

### Autres LLMs
Le serveur suit le standard MCP et devrait fonctionner avec tout LLM compatible.

## 📝 Exemples d'usage

```bash
# Météo de Paris
curl -X POST http://localhost:3000/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "get_weather", "arguments": {"city": "Paris"}}'

# Prévisions de Londres
curl -X POST http://localhost:3000/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "get_weather_forecast", "arguments": {"city": "London", "country": "GB"}}'
```

## 🐛 Dépannage

### Problèmes courants

1. **Erreur de clé API** :
   - Vérifiez que `WEATHER_API_KEY` est définie
   - Vérifiez que la clé est valide sur OpenWeatherMap

2. **Ville introuvable** :
   - Vérifiez l'orthographe de la ville
   - Utilisez le code pays pour plus de précision

3. **Problèmes Docker** :
   ```bash
   # Reconstruction complète
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

## 📄 Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## 🙋‍♂️ Support

Pour toute question ou problème :
1. Consultez les logs : `docker-compose logs mcp-weather-server`
2. Vérifiez la configuration dans `.env`
3. Testez la clé API directement sur OpenWeatherMap

---

Made with ❤️ for the MCP ecosystem
