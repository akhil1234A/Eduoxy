FROM node:23-slim

WORKDIR /app

COPY .next/ .next/
COPY public/ public/
COPY package.json package-lock.json ./
COPY node_modules/ node_modules/

# RUN npm install

# COPY . .


# RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
