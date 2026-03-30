# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (generates package-lock.json)
RUN npm install

# Copy source code
COPY . .

# Accept build arguments for Vite
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ARG VITE_API_BASE_URL
ARG VITE_API_ALL_COURSES_URL

# Set as environment variables for Vite build
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_ALL_COURSES_URL=$VITE_API_ALL_COURSES_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration if you have one, otherwise use default
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 3000 to match docker-compose
EXPOSE 3000

# Create a custom nginx config to run on port 3000
RUN echo 'server { \
    listen 3000; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]

