# Stage 1: Build React
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve Nginx
FROM nginx:alpine
# Xóa web mặc định
RUN rm -rf /usr/share/nginx/html/*
# Copy code React đã build
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy file cấu hình Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
