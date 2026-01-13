# =============================================================================
# OdinRing Frontend Dockerfile
# =============================================================================
# Multi-stage build for development and production

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:18-alpine as dependencies

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# =============================================================================
# Stage 2: Development
# =============================================================================
FROM node:18-alpine as development

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "start"]

# =============================================================================
# Stage 3: Builder
# =============================================================================
FROM node:18-alpine as builder

WORKDIR /app

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Build application
ENV NODE_ENV=production
RUN npm run build

# =============================================================================
# Stage 4: Production
# =============================================================================
FROM nginx:alpine as production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

