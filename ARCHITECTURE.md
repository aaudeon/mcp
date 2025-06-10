# Architecture n8n avec RAG et Redis

## Vue d'ensemble

Cette configuration déploie une stack complète pour n8n en mode production avec :

- **n8n** : Plateforme d'automatisation des workflows
- **PostgreSQL** : Base de données principale pour n8n
- **Redis** : Cache et gestion des queues pour les performances
- **Quadrant** : Base de données vectorielle pour RAG (Retrieval Augmented Generation)
- **MCP Weather Server** : Serveur MCP personnalisé pour les données météo

## Architecture des services

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      n8n        │    │   PostgreSQL    │    │     Redis       │
│  (Workflows)    │◄──►│  (Persistence)  │    │   (Cache/Queue) │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              ▲
         │                                              │
         ▼                                              │
┌─────────────────┐    ┌─────────────────┐              │
│    Quadrant     │    │  MCP Weather    │              │
│  (Vector DB)    │    │    Server       │              │
│     (RAG)       │    │                 │              │
└─────────────────┘    └─────────────────┘              │
         ▲                                              │
         │                                              │
         └──────────────────────────────────────────────┘
                    (via n8n workflows)
```

## Configuration des services

### n8n (Port 5678)
- **Mode** : Production avec utilisateurs multiples
- **Base de données** : PostgreSQL pour la persistance
- **Cache** : Redis pour améliorer les performances
- **Queues** : Redis Bull pour la gestion des tâches en arrière-plan
- **Volumes** : 
  - `/home/node/.n8n` : Configuration et données utilisateur
  - `/home/node/workflows` : Stockage des workflows
- **Accès** : https://n8n.top-exo.fr

### PostgreSQL (Port 5432)
- **Version** : 16 Alpine
- **Base** : `n8n`
- **Utilisateur** : `n8n_user`
- **Volume** : `n8n_postgres_data` pour la persistance
- **Health check** : Vérification de disponibilité toutes les 30s

### Redis (Port 6379)
- **Version** : 7 Alpine
- **Mode** : Persistance AOF activée
- **Authentification** : Mot de passe configuré
- **Volume** : `n8n_redis_data` pour la persistance
- **Usage** :
  - Cache des données n8n
  - Queues Bull pour les workflows
  - Sessions utilisateur

### Quadrant (Ports 6333/6334)
- **Version** : Latest
- **API HTTP** : Port 6333
- **API gRPC** : Port 6334
- **Volume** : `n8n_quadrant_data` pour les vecteurs
- **Usage** :
  - Stockage de vecteurs pour RAG
  - Recherche sémantique dans la documentation
  - Base de connaissances pour l'IA

### MCP Weather Server (Port 3000)
- **Protocole** : MCP (Model Context Protocol)
- **API** : Open-Meteo (gratuite)
- **Usage** : Données météorologiques pour les workflows
- **Accès** : https://mcp-weather.top-exo.fr

## Utilisation des scripts

### Gestion de Quadrant
```bash
# Initialisation complète (recommandé au premier déploiement)
./quadrant-setup.sh init

# Vérifier le statut
./quadrant-setup.sh status

# Lister les collections existantes
./quadrant-setup.sh list-collections

# Créer une nouvelle collection
./quadrant-setup.sh create-collection
```

### Monitoring Redis
```bash
# Statut général
./redis-monitor.sh status

# Analyser les clés par catégorie
./redis-monitor.sh keys

# Statistiques détaillées
./redis-monitor.sh stats

# Analyse mémoire
./redis-monitor.sh memory

# Monitoring en temps réel
./redis-monitor.sh monitor
```

## Intégration RAG dans n8n

### 1. Création de workflows RAG

Vous pouvez créer des workflows n8n qui :

1. **Ingestion de documents** :
   - Lisent des documents (PDF, TXT, MD)
   - Génèrent des embeddings via OpenAI/Ollama
   - Stockent les vecteurs dans Quadrant

2. **Recherche sémantique** :
   - Reçoivent une question utilisateur
   - Génèrent l'embedding de la question
   - Recherchent dans Quadrant les documents similaires
   - Formatent la réponse avec le contexte trouvé

### 2. Nœuds n8n recommandés

- **HTTP Request** : Pour interroger Quadrant API
- **Code** : Pour traiter les embeddings
- **OpenAI** : Pour génération des embeddings/réponses
- **Webhook** : Pour déclencher les recherches RAG

### 3. Exemple d'intégration

```javascript
// Exemple de recherche dans Quadrant depuis un nœud Code n8n
const searchQuery = $input.first().json.query;
const searchVector = await getEmbedding(searchQuery); // via OpenAI

const quadrantResponse = await fetch('http://quadrant:6333/collections/n8n_knowledge_base/points/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    vector: searchVector,
    limit: 5,
    with_payload: true
  })
});

const results = await quadrantResponse.json();
return results.result.map(hit => ({
  score: hit.score,
  content: hit.payload.content,
  title: hit.payload.title
}));
```

## Variables d'environnement importantes

Consultez le fichier `.env` pour :
- Mots de passe des bases de données
- Clés de chiffrement n8n
- Configuration Redis
- Paramètres Quadrant

## Sauvegarde et maintenance

### Sauvegarde des données
```bash
# PostgreSQL
docker exec n8n-postgres pg_dump -U n8n_user n8n > backup_n8n_$(date +%Y%m%d).sql

# Redis (si nécessaire)
docker exec n8n-redis redis-cli --rdb /data/dump.rdb

# Quadrant
docker cp n8n-quadrant:/qdrant/storage ./backup_quadrant_$(date +%Y%m%d)/
```

### Monitoring
- Logs : `docker compose logs -f [service]`
- Métriques : Via les scripts fournis
- Health checks : Configurés pour tous les services

## Sécurité

- Mots de passe forts générés automatiquement
- Réseau isolé (`mcp-network`)
- Accès HTTPS via Traefik
- Variables d'environnement sécurisées
- Health checks pour la détection de pannes

## Performance

- Redis pour le cache et les queues
- PostgreSQL optimisé pour n8n
- Quadrant configuré pour des recherches rapides
- Volumes nommés pour des I/O optimisées
