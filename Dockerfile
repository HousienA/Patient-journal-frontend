# Stage 1: Build
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .

# FIX: Set these to empty strings so the frontend uses relative paths (e.g. /api/clinical/...)
# which Nginx will then proxy to the correct service.
ENV VITE_CLINICAL_API_URL=
ENV VITE_MESSAGING_API_URL=
ENV VITE_SEARCH_API_URL=
ENV VITE_IMAGE_API_URL=
# Keycloak usually stays absolute because it handles redirects,
# but if you are proxying it too, change it.
# For now, assuming Keycloak is external/accessible directly:
ENV VITE_KEYCLOAK_URL=http://localhost:8080

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
