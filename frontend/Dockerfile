FROM node:20

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then echo "Root lockfile found"; else echo "No root lockfile"; fi

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install --prefer-offline --no-audit

COPY frontend/ .

EXPOSE 3001

CMD ["npm", "run", "dev", "--", "-p", "3001"]
