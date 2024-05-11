FROM node:17-alpine

WORKDIR /build

COPY src/server/package.json src/server/yarn.lock server/
RUN cd server && yarn install --prod --ignore-optional
