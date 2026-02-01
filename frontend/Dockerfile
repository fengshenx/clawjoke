FROM node:20

WORKDIR /app

COPY package*.json ./
COPY package-lock.json ./

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
