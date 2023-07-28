# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm i

COPY . .

RUN npm run build

# Production Stage
FROM node:18-alpine 

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm i --production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]