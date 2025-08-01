# Multi-stage build for NestJS Humid App
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY jest.config.ts ./
COPY jest.preset.js ./
COPY eslint.config.mjs ./

# Copy source code
COPY apps/humid ./apps/humid
COPY libs ./libs

# Install all dependencies (including dev dependencies for build)
RUN npm ci && npm cache clean --force

# Build the application
RUN npx nx build humid --configuration=production

# Production stage
FROM node:22-alpine AS production

# Install required packages including wget for health checks
RUN apk add --no-cache dumb-init wget

# Create app directory and user
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy built application from builder stage
COPY --from=builder /app/dist/apps/humid ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Create logs directory structure with proper permissions BEFORE switching to non-root user
RUN mkdir -p logs/Humid && \
    chown -R nestjs:nodejs logs && \
    chmod -R 755 logs

RUN mkdir -p resources/images && \
    chown -R nestjs:nodejs resources && \
    chmod -R 777 resources

# Change ownership of the entire app directory
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose the port the app runs on
EXPOSE 3000

# Start the application with dumb-init
CMD ["dumb-init", "--", "node", "main.js"]
