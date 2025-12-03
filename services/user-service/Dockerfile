FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY services/user-service/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY services/user-service ./

# Build the application
RUN npm run build

# Expose port
ENV PORT=3002
EXPOSE 3002

# Start the application
CMD ["node", "dist/main"]