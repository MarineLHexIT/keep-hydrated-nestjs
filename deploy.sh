#!/bin/bash

# Vérifier que toutes les variables d'environnement requises sont définies
required_vars=(
  "DATABASE_URL"
  "MYSQL_ROOT_PASSWORD"
  "MYSQL_USER"
  "MYSQL_PASSWORD"
  "JWT_SECRET"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    exit 1
  fi
done

# Construire et démarrer les conteneurs
echo "Building and starting containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# Attendre que MySQL soit prêt
echo "Waiting for MySQL to be ready..."
sleep 30

# Exécuter les migrations Prisma
echo "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

echo "Deployment completed successfully!" 