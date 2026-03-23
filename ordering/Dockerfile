# --------- Stage 1: Build Frontend ---------
FROM node:20-alpine AS build

WORKDIR /app
# Copy ordering package files
COPY package.json package-lock.json* ./
RUN npm install

# Build frontend
COPY . .
RUN npm run build


# --------- Stage 2: Serve Backend & Frontend ---------
FROM node:20-alpine

WORKDIR /app/backend
# Copy backend files and install production dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production

# Copy backend source
COPY backend/ ./

# Copy built frontend assets to the parent dir expected by server.js
COPY --from=build /app/dist /app/dist

# Expose backend port
EXPOSE 3001

# Start the Node.js server
CMD ["node", "server.js"]
