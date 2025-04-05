#!/bin/bash

# Exit on error
set -e

case "$1" in
  start)
    echo "Starting development environment..."
    docker-compose up -d
    echo "App started!"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:5010"
    ;;
  stop)
    echo "Stopping development environment..."
    docker-compose down
    ;;
  logs)
    echo "Showing logs..."
    docker-compose logs -f
    ;;
  rebuild)
    echo "Rebuilding services..."
    docker-compose build
    docker-compose up -d
    ;;
  *)
    echo "Usage: $0 {start|stop|logs|rebuild}"
    exit 1
    ;;
esac
