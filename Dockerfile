# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Build your Next.js application
RUN npm run build

# Make your app's port available to the outside world
ENV PORT=8080
EXPOSE 8080

# The command to run your app
CMD ["npm", "start"]
