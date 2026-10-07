FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

FROM base AS dev
ENV VITE_DEVTOOLS=true
ENV VITE_DEV_API_URL=http://api:3000
EXPOSE 80
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"]

FROM base AS build
ARG VITE_USE_API=true
ARG VITE_API_BASE=http://localhost:3000/api
ARG VITE_DEVTOOLS=false
ENV VITE_USE_API=$VITE_USE_API
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_DEVTOOLS=$VITE_DEVTOOLS
RUN npm run build

FROM nginx:1.27-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
