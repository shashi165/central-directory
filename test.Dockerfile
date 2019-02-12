FROM mhart/alpine-node:10.15.1
USER root

WORKDIR /opt/central-directory
COPY src /opt/central-directory/src
COPY migrations /opt/central-directory/migrations
COPY config /opt/central-directory/config
COPY package.json server.sh /opt/central-directory/
COPY test /opt/central-directory/test

RUN chmod +x /opt/central-directory/server.sh && \
    apk --no-cache add git
RUN apk add --no-cache make gcc g++ python libtool autoconf automake && \
    cd $(npm root -g)/npm && \
    apk add -U iproute2 && ln -s /usr/lib/tc /lib/tc && \
    apk add -U iptables && \
    npm install -g node-gyp

RUN npm install -g tape tapes tap-xunit

RUN npm install

EXPOSE 5678
EXPOSE 3000

CMD ["/opt/central-directory/server.sh"]
