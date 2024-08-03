FROM [server-modules] AS server-modules

FROM node:17-alpine

WORKDIR /srv/server

COPY src/server/ .
COPY --from=server-modules /build/server/node_modules/ node_modules/

ARG GREETING
ARG SERVER_PORT

ENV GREETING=${GREETING}
ENV SERVER_PORT=${SERVER_PORT}

ENV NODE_ENV=production

USER node

CMD ["node", "."]
