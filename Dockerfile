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
RUN echo "Running database migrations..." && \
    npx prisma migrate deploy && \
    echo "Database migrations completed successfully"

EXPOSE 3000

CMD ["yarn", "start:prod"] 