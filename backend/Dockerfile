# Base image
FROM node:18-alpine AS builder

# Working directory
WORKDIR /app

# Copy dependency configs
COPY package.json ./
COPY tsconfig.json ./

# Install packages using local cache to avoid permission errors
RUN npm install --cache ./npm-cache

# Copy prisma schema first
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source
COPY src ./src/

# Compile TypeScript
RUN npm run build

# Run-stage image
FROM node:18-alpine

WORKDIR /app

# Copy package and lock
COPY package.json ./

# Install production dependencies only
RUN npm install --only=production --cache ./npm-cache

# Copy compiled build and prisma assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

ENV NODE_ENV=production

CMD ["npm", "start"]
