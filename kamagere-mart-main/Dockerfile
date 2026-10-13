FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm --prefix backend ci --omit=dev

COPY backend ./backend
COPY E-commerce_frontend ./E-commerce_frontend

WORKDIR /app/backend
EXPOSE 8080
CMD ["node", "server.js"]
