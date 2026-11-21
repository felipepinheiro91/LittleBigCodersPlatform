FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
RUN test -n "$VITE_API_URL" && npm run build

FROM nginx:1.28-alpine
ENV API_UPSTREAM=littlebigcoders-api:8000 NGINX_ENVSUBST_FILTER=^API_UPSTREAM$
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
