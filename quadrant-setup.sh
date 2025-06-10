#!/bin/bash

# Script d'initialisation et gestion de Quadrant pour RAG
# Usage: ./quadrant-setup.sh [init|status|create-collection|list-collections]

QUADRANT_URL="http://localhost:6333"
COLLECTION_NAME="n8n_knowledge_base"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction pour vérifier si Quadrant est disponible
check_quadrant() {
    log_info "Vérification de la disponibilité de Quadrant..."
    if curl -s -f "$QUADRANT_URL/" > /dev/null; then
        log_success "Quadrant est accessible sur $QUADRANT_URL"
        return 0
    else
        log_error "Quadrant n'est pas accessible sur $QUADRANT_URL"
        return 1
    fi
}

# Fonction pour afficher le statut de Quadrant
show_status() {
    log_info "État de Quadrant:"
    curl -s "$QUADRANT_URL/" | jq '.' 2>/dev/null || echo "Impossible de récupérer le statut (jq non disponible)"
}

# Fonction pour lister les collections
list_collections() {
    log_info "Collections existantes dans Quadrant:"
    curl -s "$QUADRANT_URL/collections" | jq '.result.collections[] | {name: .name, status: .status, points_count: .points_count}' 2>/dev/null || {
        log_warning "jq non disponible, affichage brut:"
        curl -s "$QUADRANT_URL/collections"
    }
}

# Fonction pour créer une collection pour la base de connaissances n8n
create_knowledge_collection() {
    log_info "Création de la collection '$COLLECTION_NAME' pour RAG..."
    
    # Configuration de la collection avec des vecteurs 1536 dimensions (compatible OpenAI embeddings)
    COLLECTION_CONFIG='{
        "vectors": {
            "size": 1536,
            "distance": "Cosine"
        },
        "optimizers_config": {
            "default_segment_number": 2,
            "max_segment_size": 20000,
            "memmap_threshold": 20000,
            "indexing_threshold": 10000,
            "flush_interval_sec": 10,
            "max_optimization_threads": 2
        },
        "replication_factor": 1,
        "write_consistency_factor": 1
    }'
    
    # Créer la collection
    response=$(curl -s -w "%{http_code}" -X PUT "$QUADRANT_URL/collections/$COLLECTION_NAME" \
        -H "Content-Type: application/json" \
        -d "$COLLECTION_CONFIG")
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        log_success "Collection '$COLLECTION_NAME' créée avec succès"
        
        # Créer un index pour optimiser les recherches
        log_info "Création d'un index pour optimiser les recherches..."
        curl -s -X POST "$QUADRANT_URL/collections/$COLLECTION_NAME/index" \
            -H "Content-Type: application/json" \
            -d '{
                "field_name": "document_type",
                "field_schema": "keyword"
            }' > /dev/null
            
        log_success "Index créé pour le champ 'document_type'"
    else
        log_error "Échec de la création de la collection (HTTP: $http_code)"
        echo "$response_body"
    fi
}

# Fonction pour injecter des données d'exemple dans la collection
inject_sample_data() {
    log_info "Injection de données d'exemple dans la collection '$COLLECTION_NAME'..."
    
    # Générer des vecteurs d'exemple
    VECTOR1=$(python3 -c "import random; print([random.random() for _ in range(1536)])" 2>/dev/null || echo "[$(seq -s, 1 1536 | sed 's/[0-9]\+/0.5/g')]")
    VECTOR2=$(python3 -c "import random; print([random.random() for _ in range(1536)])" 2>/dev/null || echo "[$(seq -s, 1 1536 | sed 's/[0-9]\+/0.3/g')]")
    
    # Données d'exemple avec des vecteurs
    SAMPLE_DATA="{
        \"points\": [
            {
                \"id\": 1,
                \"vector\": $VECTOR1,
                \"payload\": {
                    \"document_type\": \"workflow_documentation\",
                    \"title\": \"Guide de démarrage n8n\",
                    \"content\": \"n8n est une plateforme d'automatisation de workflows qui permet de connecter différents services et APIs.\",
                    \"tags\": [\"automation\", \"workflow\", \"integration\"],
                    \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                }
            },
            {
                \"id\": 2,
                \"vector\": $VECTOR2,
                \"payload\": {
                    \"document_type\": \"node_documentation\",
                    \"title\": \"HTTP Request Node\",
                    \"content\": \"Le nœud HTTP Request permet d'effectuer des requêtes HTTP vers des APIs externes.\",
                    \"tags\": [\"http\", \"api\", \"request\"],
                    \"created_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
                }
            }
        ]
    }"
    
    response=$(curl -s -w "%{http_code}" -X PUT "$QUADRANT_URL/collections/$COLLECTION_NAME/points" \
        -H "Content-Type: application/json" \
        -d "$SAMPLE_DATA")
    
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        log_success "Données d'exemple injectées avec succès"
    else
        log_error "Échec de l'injection des données d'exemple (HTTP: $http_code)"
    fi
}

# Fonction d'initialisation complète
init_quadrant() {
    log_info "Initialisation complète de Quadrant pour n8n RAG..."
    
    if ! check_quadrant; then
        exit 1
    fi
    
    create_knowledge_collection
    inject_sample_data
    
    log_success "Initialisation terminée ! Collection '$COLLECTION_NAME' prête pour RAG"
    list_collections
}

# Menu principal
case "$1" in
    "init")
        init_quadrant
        ;;
    "status")
        check_quadrant && show_status
        ;;
    "create-collection")
        check_quadrant && create_knowledge_collection
        ;;
    "list-collections")
        check_quadrant && list_collections
        ;;
    "inject-sample")
        check_quadrant && inject_sample_data
        ;;
    *)
        echo "Usage: $0 [init|status|create-collection|list-collections|inject-sample]"
        echo ""
        echo "Commandes disponibles:"
        echo "  init              - Initialisation complète (collection + données d'exemple)"
        echo "  status            - Afficher le statut de Quadrant"
        echo "  create-collection - Créer la collection pour RAG"
        echo "  list-collections  - Lister toutes les collections"
        echo "  inject-sample     - Injecter des données d'exemple"
        exit 1
        ;;
esac
