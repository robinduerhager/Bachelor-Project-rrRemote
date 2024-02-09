FROM node:alpine
WORKDIR /usr/src
COPY /package*.json ./
COPY /build ./build
RUN npm install --production
CMD ["npm", "start"]