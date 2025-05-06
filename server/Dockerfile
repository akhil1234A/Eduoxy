FROM node:23-slim

WORKDIR /app

COPY dist/ dist/
COPY package.json package-lock.json ./
COPY node_modules/ node_modules/

# RUN npm install

# COPY . .

# RUN npm run build

EXPOSE 8000

CMD ["npm", "start"]
