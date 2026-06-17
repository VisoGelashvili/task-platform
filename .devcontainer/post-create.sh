set -e

if [ ! -f .env ]; then
  cp .env.example .env
fi

docker compose up -d


npm install --prefix frontend
npm install --prefix backend

echo ""
echo "Infrastructure running and dependencies installed. Ready for attachment."