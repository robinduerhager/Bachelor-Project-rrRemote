FROM node:alpine
WORKDIR /usr/src
COPY /package*.json ./
COPY /build ./build
# fbc.json was removed from the repo
COPY fbc.json /home/rrremote/firebase-account-file.json
RUN npm install --production
CMD ["npm", "start"]