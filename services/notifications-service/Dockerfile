FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
ENV PORT=3003
EXPOSE 3003
CMD ["node", "dist/main.js"]