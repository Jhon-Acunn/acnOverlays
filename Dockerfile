FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
RUN npm prune --omit=dev
# Build info: written at image build time. Exposed by the server at /api/build-info
# so the dashboard can show "last deploy" timestamp. Approximates the last git push
# (Portainer rebuilds the image on every push to main, so builtAt ≈ push time + rebuild time).
RUN echo "{\"builtAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > /app/build-info.json
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', r => { process.exit(r.statusCode===200?0:1) }).on('error',()=>process.exit(1))"
CMD ["node", "src/server/server.js"]
