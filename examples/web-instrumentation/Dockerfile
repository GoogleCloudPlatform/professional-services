# Docker build file to containerize the Node.js web instrumentation example
FROM node:12-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Copy code from local directory
COPY . ./

# Run the app on container startup.
CMD [ "npm", "start" ]
