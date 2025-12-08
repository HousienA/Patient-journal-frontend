# Stage 1: Build
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .

# Keep these empty to force the app to use relative paths
ENV VITE_CLINICAL_API_URL=
ENV VITE_MESSAGING_API_URL=
ENV VITE_SEARCH_API_URL=
ENV VITE_IMAGE_API_URL=


# Use for kth cloud deployment
ENV VITE_KEYCLOAK_URL=https://journal-keycloak0.app.cloud.cbh.kth.se
# USE THIS FOR LOCAL MINIKUBE
# ENV VITE_KEYCLOAK_URL=http://localhost:8080

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
