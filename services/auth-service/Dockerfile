FROM node:22-alpine
WORKDIR /app
COPY packages/contracts ./packages/contracts
RUN npm --prefix packages/contracts install --no-audit --no-fund \
  && npm --prefix packages/contracts run build
COPY services/auth-service/package.json ./
RUN npm install --no-audit --no-fund
COPY services/auth-service/tsconfig.json ./
COPY services/auth-service/src ./src
RUN npm run build
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/main.js"]