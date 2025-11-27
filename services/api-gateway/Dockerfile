FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/main.js"]