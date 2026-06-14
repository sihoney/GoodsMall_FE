FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Node 이미지에서 lockfile 기준으로 의존성을 설치한다.
RUN npm ci

COPY . .
# Vite production build 결과를 dist 폴더에 생성한다.
RUN npm run build

# 빌드 결과물을 Nginx 이미지로 복사해 정적 파일로 제공한다.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
