FROM node:22-alpine
WORKDIR /app
COPY packages/contracts ./packages/contracts
RUN npm --prefix packages/contracts install --no-audit --no-fund \
  && npm --prefix packages/contracts run build
COPY services/rating-review-service/package.json ./
RUN npm install --no-audit --no-fund
COPY services/rating-review-service/tsconfig.json ./
COPY services/rating-review-service/src ./src
RUN npm run build
ENV PORT=3008
EXPOSE 3008
CMD ["node", "dist/main.js"]
