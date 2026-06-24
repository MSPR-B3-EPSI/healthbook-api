FROM node:22-bookworm-slim

WORKDIR /workspace

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm run start:dev"]

