FROM node:22-alpine
WORKDIR /app
COPY packages/contracts ./packages/contracts
RUN npm --prefix packages/contracts install --no-audit --no-fund \
  && npm --prefix packages/contracts run build
COPY services/barber-service/package.json ./
RUN npm install --no-audit --no-fund
COPY services/barber-service/tsconfig.json ./
COPY services/barber-service/src ./src
RUN npm run build
ENV PORT=3003
EXPOSE 3003
CMD ["node", "dist/main.js"]
