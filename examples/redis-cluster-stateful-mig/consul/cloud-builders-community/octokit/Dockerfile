FROM node as builder

ADD . .

RUN npm ci
RUN npx tsc

ENTRYPOINT ["node", "/build/index.js"]
