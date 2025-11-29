FROM node:22-alpine
WORKDIR /app
COPY packages/contracts ./packages/contracts
RUN npm --prefix packages/contracts install --no-audit --no-fund \
  && npm --prefix packages/contracts run build
COPY services/portfolio-service/package.json ./
RUN npm install --no-audit --no-fund
COPY services/portfolio-service/tsconfig.json ./
COPY services/portfolio-service/src ./src
RUN npm run build
ENV PORT=3004
EXPOSE 3004
CMD ["node", "dist/main.js"]