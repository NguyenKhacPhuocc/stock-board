# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install all dependencies (including devDependencies) for building
RUN npm ci

COPY . .

RUN npm run build

# Production Stage
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "start"]
