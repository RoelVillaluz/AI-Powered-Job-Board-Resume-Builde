FROM node:20

WORKDIR /app

# Install dependencies first (best caching layer)
COPY backend/package*.json ./

RUN npm install

# Copy backend source only
COPY backend/ ./

# Build step (only if you use TS build step)
# RUN npm run build

EXPOSE 5000

CMD ["npx", "tsx", "src/server.js"]