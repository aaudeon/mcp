#!/bin/bash

# Script de monitoring et gestion Redis pour n8n
# Usage: ./redis-monitor.sh [status|keys|flush|stats|memory]

REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="redis_secure_password_2025!"

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

# Fonction pour exécuter des commandes Redis
redis_cmd() {
    if [ -n "$REDIS_PASSWORD" ]; then
        docker exec n8n-redis redis-cli -a "$REDIS_PASSWORD" --no-auth-warning "$@"
    else
        docker exec n8n-redis redis-cli "$@"
    fi
}

# Vérifier la connexion Redis
check_redis() {
    log_info "Vérification de la connexion Redis..."
    if redis_cmd ping > /dev/null 2>&1; then
        log_success "Redis est accessible"
        return 0
    else
        log_error "Impossible de se connecter à Redis"
        return 1
    fi
}

# Afficher le statut Redis
show_status() {
    log_info "Statut de Redis:"
    echo "Connection: $(redis_cmd ping)"
    echo "Version: $(redis_cmd info server | grep redis_version | cut -d: -f2 | tr -d '\r')"
    echo "Mode: $(redis_cmd info server | grep redis_mode | cut -d: -f2 | tr -d '\r')"
    echo "Uptime: $(redis_cmd info server | grep uptime_in_seconds | cut -d: -f2 | tr -d '\r') secondes"
}

# Lister les clés avec des patterns utiles pour n8n
show_keys() {
    log_info "Clés Redis par catégorie:"
    
    echo -e "\n${YELLOW}=== Queues n8n ===${NC}"
    redis_cmd keys "bull:*" | head -10
    
    echo -e "\n${YELLOW}=== Cache n8n ===${NC}"
    redis_cmd keys "n8n:cache:*" | head -10
    
    echo -e "\n${YELLOW}=== Sessions ===${NC}"
    redis_cmd keys "sess:*" | head -10
    
    echo -e "\n${YELLOW}=== Statistiques générales ===${NC}"
    echo "Total des clés: $(redis_cmd dbsize)"
    echo "Clés Bull: $(redis_cmd keys "bull:*" | wc -l)"
    echo "Clés Cache: $(redis_cmd keys "n8n:cache:*" | wc -l)"
}

# Afficher les statistiques détaillées
show_stats() {
    log_info "Statistiques Redis détaillées:"
    
    echo -e "\n${YELLOW}=== Mémoire ===${NC}"
    redis_cmd info memory | grep -E "(used_memory_human|used_memory_peak_human|mem_fragmentation_ratio)"
    
    echo -e "\n${YELLOW}=== Connexions ===${NC}"
    redis_cmd info clients | grep -E "(connected_clients|blocked_clients)"
    
    echo -e "\n${YELLOW}=== Commandes ===${NC}"
    redis_cmd info stats | grep -E "(total_commands_processed|instantaneous_ops_per_sec)"
    
    echo -e "\n${YELLOW}=== Keyspace ===${NC}"
    redis_cmd info keyspace
}

# Afficher l'utilisation mémoire détaillée
show_memory() {
    log_info "Analyse de l'utilisation mémoire Redis:"
    
    echo -e "\n${YELLOW}=== Mémoire globale ===${NC}"
    redis_cmd memory usage
    redis_cmd info memory | grep -E "(used_memory|maxmemory|mem_fragmentation)"
    
    echo -e "\n${YELLOW}=== Top 10 des clés consommant le plus de mémoire ===${NC}"
    # Cette commande nécessite Redis 4.0+
    redis_cmd --scan --pattern "*" | head -20 | while read key; do
        size=$(redis_cmd memory usage "$key" 2>/dev/null || echo "N/A")
        echo "$key: $size bytes"
    done | sort -k2 -nr | head -10
}

# Nettoyer le cache (attention: supprime toutes les données!)
flush_cache() {
    log_warning "Cette opération va supprimer TOUTES les données Redis!"
    read -p "Êtes-vous sûr? [y/N]: " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        redis_cmd flushall
        log_success "Cache Redis vidé"
    else
        log_info "Opération annulée"
    fi
}

# Monitoring en temps réel
monitor_realtime() {
    log_info "Monitoring Redis en temps réel (Ctrl+C pour arrêter):"
    redis_cmd monitor
}

# Menu principal
case "$1" in
    "status")
        check_redis && show_status
        ;;
    "keys")
        check_redis && show_keys
        ;;
    "stats")
        check_redis && show_stats
        ;;
    "memory")
        check_redis && show_memory
        ;;
    "flush")
        check_redis && flush_cache
        ;;
    "monitor")
        check_redis && monitor_realtime
        ;;
    *)
        echo "Usage: $0 [status|keys|stats|memory|flush|monitor]"
        echo ""
        echo "Commandes disponibles:"
        echo "  status   - Afficher le statut de base de Redis"
        echo "  keys     - Lister les clés par catégorie"
        echo "  stats    - Statistiques détaillées"
        echo "  memory   - Analyse de l'utilisation mémoire"
        echo "  flush    - Vider tout le cache (ATTENTION: destructif!)"
        echo "  monitor  - Monitoring en temps réel"
        exit 1
        ;;
esac
