FROM node:20

WORKDIR /app

COPY package*.json ./
RUN if [ -f package-lock.json ]; then echo "Root lockfile found"; else echo "No root lockfile"; fi

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline --no-audit --no-workspaces || npm install --prefer-offline --no-audit --no-workspaces

COPY frontend/ .

# Build the application with workspace disabled
RUN NEXT_IGNORE_INCORRECT_LOCKFILE=1 npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
