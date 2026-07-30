FROM node:22-alpine AS dep_install
WORKDIR /app
COPY package*.json ./

RUN ["npm", "ci"]

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=dep_install /app/node_modules ./node_modules

COPY . .

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

RUN npm ci --omit=dev && npm cache clean --force

EXPOSE 3000

CMD [ "npm", "start" ]
