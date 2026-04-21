FROM node:20

# Install system deps
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential

WORKDIR /app

# Install Node deps first (for caching)
COPY backend/package*.json ./
RUN npm install

# Setup Python venv
COPY backend/src/python_scripts/requirements.txt ./requirements.txt

RUN python3 -m venv /venv
RUN /venv/bin/pip install --upgrade pip
RUN /venv/bin/pip install -r requirements.txt

# Copy rest of backend
COPY backend/ .

# Use Python venv
ENV PATH="/venv/bin:$PATH"

EXPOSE 5000

CMD ["npx", "tsx", "--tsconfig", "tsconfig.json", "src/server.js"]