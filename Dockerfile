FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# @google-cloud/tasks loads this generated descriptor at runtime. Next.js
# standalone tracing omits it because the package resolves the path dynamically.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@google-cloud/tasks/build/protos/protos.json ./node_modules/@google-cloud/tasks/build/protos/protos.json
USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
