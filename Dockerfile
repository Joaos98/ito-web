# Use Node 22 (modern and Fly-compatible)
FROM node:22-alpine AS build

WORKDIR /app

# --- Build client ---
COPY client ./client
WORKDIR /app/client
RUN npm install
RUN npm run build

# --- Setup server ---
WORKDIR /app/server
COPY server ./server
RUN npm install

# --- Combine build outputs ---
WORKDIR /app
COPY . .
# Move built client assets into server/public (or wherever you serve static files)
RUN mkdir -p server/public && cp -r client/dist/* server/public/

# --- Run server ---
WORKDIR /app/server
EXPOSE 8080
CMD ["node", "index.js"]
