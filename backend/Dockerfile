FROM node:20

WORKDIR /app

# Copy workspace package files first
COPY package*.json ./
COPY package-lock.json ./

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

COPY backend/ .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
