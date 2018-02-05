FROM mhart/alpine-node:8.4

RUN apk update && apk upgrade && apk add git && apk add python && apk add make && apk add g++

RUN mkdir -p /usr/src/rpc
ADD . /usr/src/rpc

WORKDIR /usr/src/rpc
RUN npm i -g ethereumjs-testrpc@6.0.3

CMD testrpc -l 4500000000000 -u 0 -u 1 -u 2
