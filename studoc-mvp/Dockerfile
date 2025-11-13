# ---- Basis-Image mit Node 20 ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies installieren ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Production-Build erstellen ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Runtime-Image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Build-Ergebnis kopieren
COPY --from=build /app ./

# Next.js läuft standardmäßig auf Port 3000
EXPOSE 3000

# Startkommando
CMD ["npm", "run", "start"]
