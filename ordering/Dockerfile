# --------- Stage 1: Build Frontend ---------
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Vite 環境變數透過 Docker build ARG 注入
ARG VITE_API_BASE=/api/v1/open/proxy
ARG VITE_API_KEY
ARG VITE_APP_SLUG
ARG VITE_AUTH_BASE=/api/v1/custom-app-auth
ARG VITE_LINE_CHANNEL_ID
ARG VITE_LINE_CALLBACK_URL

# 設為 ENV 供 Vite build 時讀取（import.meta.env.VITE_*）
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_APP_SLUG=$VITE_APP_SLUG
ENV VITE_AUTH_BASE=$VITE_AUTH_BASE
ENV VITE_LINE_CHANNEL_ID=$VITE_LINE_CHANNEL_ID
ENV VITE_LINE_CALLBACK_URL=$VITE_LINE_CALLBACK_URL

RUN npm run build


# --------- Stage 2: Serve Backend & Frontend ---------
FROM node:20-alpine

WORKDIR /app/backend
# 安裝後端依賴
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production

# 複製後端原始碼
COPY backend/ ./

# 複製前端建置產物
COPY --from=build /app/dist /app/dist

EXPOSE 3001

CMD ["node", "server.js"]
