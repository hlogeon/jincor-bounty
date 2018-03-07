FROM mhart/alpine-node:8.6

RUN apk update && apk upgrade && apk add git && apk add python && apk add make && apk add g++

RUN npm i -g yarn
VOLUME /usr/src/workspace
RUN yarn
WORKDIR /usr/src/workspace
CMD ["yarn", "run bounty"]
