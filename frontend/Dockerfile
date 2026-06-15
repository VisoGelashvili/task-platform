FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4200

# --host 0.0.0.0 makes the dev server reachable from outside the container
CMD ["npx", "ng", "serve", "--host", "0.0.0.0"]
