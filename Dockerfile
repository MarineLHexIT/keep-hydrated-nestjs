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

# Create startup script
RUN echo '#!/bin/sh\n\
echo "Running database migrations..."\n\
npx prisma migrate deploy\n\
echo "Starting the application..."\n\
yarn start:prod' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"] 