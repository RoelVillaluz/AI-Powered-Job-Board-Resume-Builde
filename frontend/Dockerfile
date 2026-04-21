FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy app source
COPY frontend/ .

COPY shared/ ./shared

# Build production bundle
RUN npm run build

# Serve static files
RUN npm install -g serve

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]