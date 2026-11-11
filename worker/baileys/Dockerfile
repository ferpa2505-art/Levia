# Baileys Gateway Dockerfile

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN npm run type-check && mkdir -p /app/auth /app/logs && chown -R node:node /app

USER node

CMD ["npm", "run", "baileys-gateway"]