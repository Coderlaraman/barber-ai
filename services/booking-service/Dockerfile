FROM node:22-alpine
WORKDIR /app
COPY packages/contracts ./packages/contracts
RUN npm --prefix packages/contracts install --no-audit --no-fund \
  && npm --prefix packages/contracts run build
COPY services/booking-service/package.json ./
RUN npm install --no-audit --no-fund
COPY services/booking-service/tsconfig.json ./
COPY services/booking-service/src ./src
RUN npm run build
ENV PORT=3002
EXPOSE 3002
CMD ["node", "dist/main.js"]