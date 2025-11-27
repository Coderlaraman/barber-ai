FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/main.js"]