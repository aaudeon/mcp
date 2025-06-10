# 🚀 Guide de Démarrage Rapide - MCP Weather Server

## ✅ Projet Initialisé avec Succès !

Votre projet MCP Weather Server est maintenant prêt. Voici comment procéder :

## 🔧 Configuration Rapide

### 1. Obtenez une clé API météo

1. Rendez-vous sur [OpenWeatherMap](https://openweathermap.org/api)
2. Créez un compte gratuit
3. Obtenez votre clé API (gratuite jusqu'à 1000 appels/jour)

### 2. Configurez votre environnement

```bash
# Copiez le fichier d'exemple
cp .env.example .env

# Éditez le fichier .env et ajoutez votre clé API
nano .env
# ou
code .env
```

Remplacez `your_openweathermap_api_key_here` par votre vraie clé API.

## 🐳 Démarrage avec Docker (Recommandé)

```bash
# Construction et lancement automatique
./deploy.sh

# OU manuellement :
docker-compose up -d

# Vérifier les logs
docker-compose logs -f mcp-weather-server
```

## 🔧 Démarrage Manuel (Développement)

```bash
# Installation des dépendances (déjà fait)
npm install

# Compilation
npm run build

# Lancement
npm start

# OU en mode développement avec rechargement automatique
npm run dev
```

## 🧪 Tests

```bash
# Test du déploiement Docker
./test.sh

# OU test avec démonstration interactive
npm run demo
```

## 📡 Utilisation avec un LLM

### Configuration Claude Desktop

Ajoutez dans votre fichier de configuration Claude (`~/Library/Application Support/Claude/claude_desktop_config.json` sur macOS) :

```json
{
  "mcpServers": {
    "weather": {
      "command": "docker",
      "args": ["run", "--rm", "-i", "--env-file", "/chemin/vers/votre/.env", "mcp-weather-server"]
    }
  }
}
```

### Configuration ChatGPT avec MCP

Utilisez le fichier `mcp-config.json` fourni comme exemple.

## 🛠️ Outils Disponibles

Le serveur MCP expose 3 outils :

1. **`get_weather`** - Météo actuelle
   ```json
   {
     "name": "get_weather",
     "arguments": {
       "city": "Paris",
       "country": "FR",
       "lang": "fr",
       "units": "metric"
     }
   }
   ```

2. **`get_weather_forecast`** - Prévisions 5 jours
   ```json
   {
     "name": "get_weather_forecast", 
     "arguments": {
       "city": "London",
       "country": "GB",
       "lang": "fr"
     }
   }
   ```

3. **`get_weather_by_coordinates`** - Météo par GPS
   ```json
   {
     "name": "get_weather_by_coordinates",
     "arguments": {
       "lat": 48.8566,
       "lon": 2.3522,
       "lang": "fr"
     }
   }
   ```

## 🔍 Vérification

### Vérifier que tout fonctionne :

```bash
# 1. Vérifier la compilation
npm run build

# 2. Vérifier Docker
docker build -t mcp-weather-server .

# 3. Tester une configuration
cat .env | grep WEATHER_API_KEY

# 4. Lancer les tests
./test.sh
```

### Résolution de problèmes :

1. **Erreur "API key missing"** → Vérifiez votre fichier `.env`
2. **Erreur "City not found"** → Vérifiez l'orthographe de la ville
3. **Timeout Docker** → Vérifiez votre connexion internet
4. **Permission denied** → Exécutez `chmod +x deploy.sh test.sh`

## 📚 Prochaines Étapes

1. **Testez le serveur** avec `npm run demo`
2. **Configurez votre LLM** pour utiliser ce serveur MCP
3. **Personnalisez** selon vos besoins (ajouter d'autres APIs météo, alertes, etc.)
4. **Déployez en production** avec `docker-compose up -d`

## 🎯 Exemple d'Interaction

Une fois configuré avec votre LLM, vous pourrez demander :

- "Quelle est la météo à Paris ?"
- "Donne-moi les prévisions pour Londres cette semaine"
- "Quel temps fait-il aux coordonnées 40.7128, -74.0060 ?"

Le LLM utilisera automatiquement votre serveur MCP pour obtenir les informations météo en temps réel !

---

🎉 **Félicitations ! Votre serveur MCP Weather est prêt à fonctionner !**

Pour toute question, consultez le README.md ou les logs Docker.
