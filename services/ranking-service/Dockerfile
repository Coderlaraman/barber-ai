FROM node:22-alpine
WORKDIR /app
COPY packages/contracts ./packages/contracts
RUN npm --prefix packages/contracts install --no-audit --no-fund \
  && npm --prefix packages/contracts run build
COPY services/ranking-service/package.json ./
RUN npm install --no-audit --no-fund
COPY services/ranking-service/tsconfig.json ./
COPY services/ranking-service/src ./src
RUN npm run build
ENV PORT=3006
EXPOSE 3006
CMD ["node", "dist/main.js"]