# Use full Node 22 (non-Alpine) to avoid musl optional deps
FROM node:22

WORKDIR /app

# Copy package files first for better layer caching
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies separately to avoid cache pollution
WORKDIR /app/client
RUN npm ci --omit=dev

WORKDIR /app/server
RUN npm ci --omit=dev

# Copy remaining source code
WORKDIR /app
COPY . .

# Build frontend
WORKDIR /app/client
RUN npm run build

# Go back to root and expose backend
WORKDIR /app
EXPOSE 8080

CMD ["node", "server/server.js"]
