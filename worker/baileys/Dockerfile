# Baileys Gateway Dockerfile

FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

RUN npm run type-check

CMD ["npm", "run", "baileys-gateway"]