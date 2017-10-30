FROM dwolla/alpine-node-make

WORKDIR /opt/central-directory
COPY . /opt/central-directory

RUN npm link sodium && \
  npm link argon2 && \
  npm install --production && \
  npm uninstall -g npm

EXPOSE 3000
CMD node src/server.js
