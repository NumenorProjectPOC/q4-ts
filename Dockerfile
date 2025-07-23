# Stage 1: Build the app
FROM node:18 AS builder

WORKDIR /app

# Accept build-time arguments
ARG VITE_API_BASE_URL
ARG VITE_LOGIN_URL
ARG VITE_MAPBOX_TOKEN

# Inject them as environment variables for Vite
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_LOGIN_URL=$VITE_LOGIN_URL
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
