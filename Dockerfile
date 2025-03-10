# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./
COPY prisma ./prisma/

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Note: Database migrations should be run after the container is up and the database is ready
# You can do this by:
# 1. Running migrations in your deployment script after the container is up
# 2. Using a separate migration job in your CI/CD pipeline
# 3. Running migrations manually with: docker-compose exec app npx prisma migrate deploy

EXPOSE 3000

CMD ["yarn", "start:prod"] 