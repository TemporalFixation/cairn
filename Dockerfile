FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM base AS builder
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npx prisma generate
RUN npm run build

# Use builder stage as runner so full node_modules are available for migrations
FROM builder AS runner
ENV NODE_ENV=production
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh
EXPOSE 3000
CMD ["sh", "entrypoint.sh"]
