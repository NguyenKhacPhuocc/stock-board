# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Remove development dependencies
RUN npm prune --production


# Production stage
FROM node:22-alpine AS runner

USER node
WORKDIR /home/node/app

ENV NODE_ENV=production

# Copy only necessary files from builder
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/package.json ./

EXPOSE 3000

# Use node directly instead of npm start to save memory and process overhead
CMD ["node", "dist/server.js"]
