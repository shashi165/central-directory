FROM mhart/alpine-node:10.15.1
USER root

WORKDIR /opt/central-directory
COPY src /opt/central-directory/src
COPY migrations /opt/central-directory/migrations
COPY config /opt/central-directory/config
COPY package.json server.sh /opt/central-directory/

RUN apk add --no-cache make gcc g++ python libtool autoconf automake && \
    apk add -U iproute2 && ln -s /usr/lib/tc /lib/tc && \
    apk add -U iptables && \
    npm install -g node-gyp && \
    chmod +x /opt/central-directory/server.sh
    
RUN npm install -g sodium@2.0.3 --unsafe-perm && \
    npm install --production

EXPOSE 3000

CMD ["/opt/central-directory/server.sh"]
