.PHONY: help build up down restart logs clean dev prod backup restore

# Default target
help:
	@echo "MTG Card Manager - Docker Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make logs         - View all logs"
	@echo "  make restart      - Restart all services"
	@echo "  make down         - Stop all services"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-build   - Build and start production"
	@echo ""
	@echo "Database:"
	@echo "  make backup       - Backup MongoDB database"
	@echo "  make restore      - Restore MongoDB database"
	@echo "  make db-shell     - Open MongoDB shell"
	@echo ""
	@echo "Maintenance:"
	@echo "  make build        - Rebuild all images"
	@echo "  make clean        - Remove all containers and volumes"
	@echo "  make prune        - Clean up Docker system"

# Development commands
dev:
	docker-compose up -d
	@echo "✓ Development environment started"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:3001"
	@echo "MongoDB:  localhost:27017"

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

restart:
	docker-compose restart

logs:
	docker-compose logs -f

# Production commands
prod:
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✓ Production environment started"

prod-build:
	docker-compose -f docker-compose.prod.yml up -d --build

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

# Database commands
backup:
	@mkdir -p ./backups
	docker-compose exec mongodb mongodump --db mtg-card-manager --out /data/backup
	docker cp mtg-mongodb:/data/backup ./backups/mongodb-backup-$$(date +%Y%m%d-%H%M%S)
	@echo "✓ Backup created in ./backups/"

restore:
	@if [ -z "$(BACKUP)" ]; then \
		echo "Error: Please specify BACKUP=path/to/backup"; \
		exit 1; \
	fi
	docker cp $(BACKUP) mtg-mongodb:/data/restore
	docker-compose exec mongodb mongorestore --db mtg-card-manager /data/restore
	@echo "✓ Database restored"

db-shell:
	docker-compose exec mongodb mongosh mtg-card-manager

# Maintenance commands
clean:
	docker-compose down -v
	@echo "✓ Containers and volumes removed"

prune:
	docker system prune -f
	@echo "✓ Docker system cleaned"

# Setup commands
setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "✓ Created .env file - please edit with your credentials"; \
	else \
		echo "✓ .env file already exists"; \
	fi

# Watch logs for specific service
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-mongodb:
	docker-compose logs -f mongodb

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:3001/health || echo "Backend not responding"
	@curl -f http://localhost:3000 || echo "Frontend not responding"
