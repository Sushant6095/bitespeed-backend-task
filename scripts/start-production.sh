#!/bin/bash

# Production startup script for Render.com deployment
# This script handles database migrations and starts the application

set -e  # Exit on any error

echo "🚀 Starting production deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Wait for database to be ready (with timeout)
echo "⏳ Waiting for database to be ready..."
timeout=60
counter=0

while ! npx prisma db pull --schema=./prisma/schema.prisma > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
        echo "❌ ERROR: Database connection timeout after ${timeout} seconds"
        exit 1
    fi
    echo "   Waiting for database... (${counter}/${timeout})"
    sleep 1
done

echo "✅ Database is ready"

# Run database migrations
echo "📦 Running database migrations..."
if npx prisma migrate deploy; then
    echo "✅ Database migrations completed successfully"
else
    echo "❌ ERROR: Database migrations failed"
    exit 1
fi

# Generate Prisma client (in case it's not already generated)
echo "🔧 Generating Prisma client..."
if npx prisma generate; then
    echo "✅ Prisma client generated successfully"
else
    echo "❌ ERROR: Prisma client generation failed"
    exit 1
fi

# Start the application
echo "🎯 Starting the application..."
exec node dist/index.js
