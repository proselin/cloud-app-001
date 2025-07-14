# Multi-stage build for Angular Cloud App
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY eslint.config.mjs  ./

# Copy source code
COPY apps/cloud ./apps/cloud
#COPY libs ./libs

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

RUN npm install -D nx


# Build the application
RUN npx nx build cloud --configuration=production

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY apps/cloud/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist/apps/cloud/browser /usr/share/nginx/html

# Copy assets and public files
COPY --from=builder /app/apps/cloud/public /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
