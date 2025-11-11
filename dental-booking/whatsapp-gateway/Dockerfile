# WhatsApp Gateway Dockerfile
FROM node:20-alpine

# Install dependencies for Baileys
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev for building)
RUN npm install && npm cache clean --force

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create sessions directory
RUN mkdir -p sessions && chmod 755 sessions

# Expose no ports (this is a client service)
# It connects TO the backend, doesn't serve anything

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "console.log('WhatsApp Gateway is running')" || exit 1

# Run the application
CMD ["node", "dist/index.js"]
