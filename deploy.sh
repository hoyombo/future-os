#!/bin/bash
set -e

echo "🚀 Future OS — Production Deploy"
echo "================================="

# Check if .env.production exists
if [ ! -f .env.production ]; then
  echo "❌ Missing .env.production. Copy .env.production.example and fill in values."
  exit 1
fi

# Build and start containers
echo "📦 Building and starting containers..."
docker compose --env-file .env.production up -d --build

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
sleep 5

# Apply migrations
echo "🗄️  Applying database migrations..."
docker compose exec -T app npx prisma migrate deploy

# Seed database (only if empty)
echo "🌱 Checking if seed is needed..."
USER_COUNT=$(docker compose exec -T app npx prisma db execute --stdin <<< "SELECT count(*) FROM \"User\";" 2>/dev/null | grep -o '[0-9]*' | head -1 || echo "0")
if [ "$USER_COUNT" = "0" ]; then
  echo "🌱 Seeding database..."
  docker compose exec -T app npx prisma db seed
fi

echo ""
echo "✅ Deployed successfully!"
echo "   App:      http://localhost:3000"
echo "   Caddy:    http://localhost:80"
echo ""
echo "   To view logs:  docker compose logs -f"
echo "   To stop:       docker compose down"
