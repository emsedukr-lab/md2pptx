FROM node:20-alpine AS deps
WORKDIR /app

# 모노레포 루트 package.json + 워크스페이스 복사
COPY ../../package.json ../../package-lock.json ./root/
COPY ../../packages/ ./root/packages/
COPY package*.json ./

# 의존성 설치 (로컬 패키지 포함)
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --from=deps /app/root/packages/ ../../packages/

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public

EXPOSE 3001
CMD ["npm", "start"]
