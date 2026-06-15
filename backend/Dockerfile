FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching — only re-runs when package.json changes)
COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/main"]
