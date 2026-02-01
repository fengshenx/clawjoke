FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY package-lock.json ./

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

COPY backend/ .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
