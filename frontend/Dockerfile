FROM node:20

# Disable npm workspaces
ENV NPM_CONFIG_WORKSPACES=false

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then echo "Root lockfile found"; else echo "No root lockfile"; fi

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit || npm install --prefer-offline --no-audit

COPY frontend/ .

# Build the application
ENV NEXT_IGNORE_INCORRECT_LOCKFILE=1
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
