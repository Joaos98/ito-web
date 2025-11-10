# Use full Debian-based Node image to avoid musl issues
FROM node:22

# Set working directory
WORKDIR /app

# Copy everything
COPY . .

# --- Build frontend ---
WORKDIR /app/client
RUN npm install
RUN npm run build

# --- Set up backend ---
WORKDIR /app/server
RUN npm install

# --- Serve built frontend ---
WORKDIR /app
EXPOSE 8080

CMD ["node", "server/index.js"]
