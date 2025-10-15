# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy all project files
COPY . .

# Build your Next.js app and server
RUN npm run build

# Expose the port (Cloud Run uses $PORT, defaults to 8080)
ENV PORT=8080
EXPOSE 8080

# Start your custom Next.js + WebSocket server
CMD ["node", "dist/server.js"]
