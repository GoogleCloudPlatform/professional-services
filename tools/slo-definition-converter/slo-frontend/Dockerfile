# Dockerfile for react app with nginx


# Base image
FROM node:alpine as builder
# Working directory
WORKDIR '/app'
# Copy package.json
COPY package.json .
# Install dependencies
RUN npm install
# Copy source code
COPY . .
# Build the app
RUN npm run build


# Run phase
FROM nginx
# Expose port 8080
EXPOSE 8080


COPY nginx.conf /etc/nginx/conf.d/default.conf


# Copy build folder from builder phase to nginx
COPY --from=builder /app/build /usr/share/nginx/html


ENTRYPOINT [ "nginx", "-g", "daemon off;" ]
