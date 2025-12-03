FROM node:22-alpine
WORKDIR /app
COPY packages/contracts ./packages/contracts
RUN npm --prefix packages/contracts install --no-audit --no-fund \
  && npm --prefix packages/contracts run build
COPY services/payment-service/package.json ./
RUN npm install --no-audit --no-fund
COPY services/payment-service/tsconfig.json ./
COPY services/payment-service/src ./src
RUN npm run build
ENV PORT=3010
EXPOSE 3010
CMD ["node", "dist/main.js"]
