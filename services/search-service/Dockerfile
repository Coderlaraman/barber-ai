FROM node:22-alpine
WORKDIR /app
COPY packages/contracts ./packages/contracts
RUN npm --prefix packages/contracts install --no-audit --no-fund \
  && npm --prefix packages/contracts run build
COPY services/search-service/package.json ./
RUN npm install --no-audit --no-fund
COPY services/search-service/tsconfig.json ./
COPY services/search-service/src ./src
RUN npm run build
ENV PORT=3005
EXPOSE 3005
CMD ["node", "dist/main.js"]