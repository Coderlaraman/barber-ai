FROM node:22-alpine
WORKDIR /app
COPY packages/contracts ./packages/contracts
RUN npm --prefix packages/contracts install --no-audit --no-fund \
  && npm --prefix packages/contracts run build
COPY services/scheduler-service/package.json ./
RUN npm install --no-audit --no-fund
COPY services/scheduler-service/tsconfig.json ./
COPY services/scheduler-service/src ./src
RUN npm run build
ENV PORT=3011
EXPOSE 3011
CMD ["node", "dist/main.js"]