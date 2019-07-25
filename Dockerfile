FROM node:12-slim

WORKDIR /src
ADD . /src

ARG env=production

RUN yarn

WORKDIR /src
EXPOSE 9090
ENV NODE_ENV $env
CMD ["npm", "start"]
