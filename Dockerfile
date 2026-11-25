# syntax=docker/dockerfile:1
# OOTD(정적 사이트) 이미지: Node 로 빌드한 dist/ 를 nginx 가 내준다.
# 서버에서는 Caddy 가 HTTPS 를 끝내고 ootd.hdg3383.com 요청을 이 컨테이너(80)로 넘긴다.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
RUN npm run build

# stable 줄은 보안 수정이 계속 나오는 nginx 안정판이다(고정한 1.27 줄은 더 이상 새로 만들지 않는다)
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
