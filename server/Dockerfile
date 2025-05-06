# Build stage
FROM node:23-slim AS builder
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm install
COPY server/ .
RUN npm run build

# Production stage
FROM node:23-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm install --production
EXPOSE 8000
CMD ["npm", "start"]