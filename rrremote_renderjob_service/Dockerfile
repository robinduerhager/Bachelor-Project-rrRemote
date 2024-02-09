FROM node:6.17.1-alpine

RUN apk add --no-cache --update \
    bash \
    glib \
    gcompat
    
WORKDIR /usr/src
COPY /package*.json ./
COPY /build ./build
# fbc.json has been removed. This was a credentials file for firebase
COPY fbc.json /home/rrremote/firebase-account-file.json
RUN npm install --production
COPY /node_modules/rrbindings ./node_modules/rrbindings
COPY /node_modules/rrshared ./node_modules/rrshared
CMD npm start