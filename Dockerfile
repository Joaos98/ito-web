# ===========================
# Stage 1: Build the Vue client
# ===========================
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install
COPY client .
RUN npm run build

# ===========================
# Stage 2: Build and run the Node server
# ===========================
FROM node:22-alpine
WORKDIR /app

# Copy only the server package files first for caching
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

# Copy server code
COPY server .

# Copy built Vue client into the server's public folder (adjust if needed)
COPY --from=client-builder /app/client/dist ./public

EXPOSE 8080

CMD ["npm", "start"]
