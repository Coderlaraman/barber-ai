FROM node:22-alpine
WORKDIR /app
COPY packages/contracts ./packages/contracts
RUN npm --prefix packages/contracts install --no-audit --no-fund \
  && npm --prefix packages/contracts run build
COPY services/api-gateway/package.json ./
RUN npm install --no-audit --no-fund
COPY services/api-gateway/tsconfig.json ./
COPY services/api-gateway/src ./src
RUN npm run build
ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/main.js"]