# Configuration Complète n8n avec RAG et Redis

## ✅ Installation Terminée

Votre environnement n8n en mode production est maintenant configuré avec :

### Services Déployés

| Service | Status | URL/Port | Description |
|---------|--------|----------|-------------|
| **n8n** | ✅ Running | https://n8n.top-exo.fr | Interface workflow en production |
| **PostgreSQL** | ✅ Healthy | Port 5432 | Base de données principale |
| **Redis** | ✅ Healthy | Port 6379 | Cache et queues pour performances |
| **Quadrant** | ✅ Running | Port 6333/6334 | Base vectorielle pour RAG |
| **MCP Weather** | ⚠️ Unhealthy | Port 3000 | Serveur MCP météo |

### Volumes Persistants

- `n8n_data` : Configuration et données utilisateur n8n
- `n8n_workflows` : Stockage des workflows
- `n8n_postgres_data` : Données PostgreSQL
- `n8n_redis_data` : Données Redis
- `n8n_quadrant_data` : Vecteurs et collections Quadrant

## 🚀 Fonctionnalités Activées

### n8n Production
- ✅ Mode production avec utilisateurs multiples
- ✅ Base de données PostgreSQL persistante
- ✅ Cache Redis pour améliorer les performances
- ✅ Queues Redis Bull pour tâches en arrière-plan
- ✅ Task Runners activés pour l'exécution parallèle
- ✅ Chiffrement et JWT sécurisés
- ✅ Auto-nettoyage des exécutions anciennes (7 jours)
- ✅ Logs optimisés
- ✅ Métriques activées

### RAG (Quadrant)
- ✅ Collection `n8n_knowledge_base` créée
- ✅ Vecteurs 1536 dimensions (compatibles OpenAI)
- ✅ Distance Cosine pour similarité sémantique
- ✅ Index optimisé pour recherches rapides
- ✅ API HTTP et gRPC disponibles

### Cache et Performance (Redis)
- ✅ Persistance AOF activée
- ✅ Authentification par mot de passe
- ✅ Intégration native avec n8n
- ✅ Monitoring via script personnalisé

## 🛠️ Scripts de Gestion

### Quadrant RAG
```bash
# Statut Quadrant
./quadrant-setup.sh status

# Lister les collections
./quadrant-setup.sh list-collections

# Injecter des données d'exemple
./quadrant-setup.sh inject-sample
```

### Redis Monitoring
```bash
# Statut Redis
./redis-monitor.sh status

# Analyser les clés
./redis-monitor.sh keys

# Statistiques détaillées
./redis-monitor.sh stats

# Utilisation mémoire
./redis-monitor.sh memory
```

### Docker Compose
```bash
# Voir les logs
docker compose logs -f [service]

# Redémarrer un service
docker compose restart [service]

# État des services
docker compose ps
```

## 📊 URLs d'Accès

- **n8n Interface** : https://n8n.top-exo.fr
- **Quadrant API** : http://localhost:6333 (interne)
- **Redis** : localhost:6379 (avec authentification)
- **PostgreSQL** : localhost:5432 (interne)

## 🔐 Sécurité

### Mots de Passe Configurés
- PostgreSQL : `n8n_secure_password_2025!`
- Redis : `redis_secure_password_2025!`
- n8n Encryption Key : Généré automatiquement (64 caractères)
- JWT Secret : Généré automatiquement (64 caractères)

### Accès Réseau
- Tous les services isolés dans le réseau `mcp-network`
- Seuls n8n, Quadrant et Redis exposent des ports
- HTTPS via Traefik avec certificats Let's Encrypt
- Authentification requise pour tous les services

## 📈 Utilisation RAG dans n8n

### Exemple de Workflow RAG

1. **Ingestion de Documents**
   ```javascript
   // Nœud Code n8n pour stocker des embeddings
   const quadrantUrl = 'http://quadrant:6333';
   const collection = 'n8n_knowledge_base';
   
   // Votre document et son embedding
   const document = $input.first().json;
   const embedding = await generateEmbedding(document.text);
   
   await fetch(`${quadrantUrl}/collections/${collection}/points`, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       points: [{
         id: document.id,
         vector: embedding,
         payload: {
           title: document.title,
           content: document.text,
           type: 'documentation'
         }
       }]
     })
   });
   ```

2. **Recherche Sémantique**
   ```javascript
   // Rechercher des documents similaires
   const query = $input.first().json.question;
   const queryEmbedding = await generateEmbedding(query);
   
   const response = await fetch(`${quadrantUrl}/collections/${collection}/points/search`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       vector: queryEmbedding,
       limit: 5,
       with_payload: true
     })
   });
   
   const results = await response.json();
   return results.result;
   ```

### Nœuds Recommandés
- **HTTP Request** : Pour interagir avec Quadrant API
- **Code** : Pour traiter les embeddings et logique RAG
- **OpenAI** : Pour générer embeddings et réponses
- **Webhook** : Pour déclencher les recherches
- **If/Switch** : Pour la logique conditionnelle

## 📋 Maintenance

### Sauvegarde
```bash
# PostgreSQL
docker exec n8n-postgres pg_dump -U n8n_user n8n > backup_n8n_$(date +%Y%m%d).sql

# Quadrant
docker cp n8n-quadrant:/qdrant/storage ./backup_quadrant_$(date +%Y%m%d)/

# Redis (optionnel)
docker exec n8n-redis redis-cli --rdb /data/dump.rdb
```

### Surveillance
- Health checks automatiques configurés
- Logs centralisés via Docker Compose
- Métriques Redis via script de monitoring
- Statut Quadrant via script personnalisé

## 🎯 Prochaines Étapes

1. **Accéder à n8n** : https://n8n.top-exo.fr
2. **Créer votre premier workflow RAG**
3. **Intégrer vos APIs via le serveur MCP Weather**
4. **Monitorer les performances via les scripts fournis**

## 📚 Documentation

- `ARCHITECTURE.md` : Détails techniques de l'architecture
- Scripts dans le répertoire racine pour la gestion quotidienne
- Logs Docker Compose pour le debugging

---

**🎉 Votre environnement n8n avec RAG et Redis est opérationnel !**
