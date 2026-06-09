# Stage 1: Build React SPA
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json ./

# Install packages using local cache to bypass permission blocks
RUN npm install --cache ./npm-cache --legacy-peer-deps

COPY . .

# Run build
RUN npm run build

# Stage 2: Serve React using Nginx
FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed, or default
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
