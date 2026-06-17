
set -e


if [ ! -f .env ]; then
  cp .env.example .env
fi

docker compose up -d

echo ""
echo "All services starting. Frontend will be available on port 4200."
