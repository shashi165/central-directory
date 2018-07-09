'use strict'

const Glob = require('glob')

exports.plugin = {
  name: 'api',
  register: function (server, options) {
    Glob.sync('**/routes.js', { cwd: __dirname }).forEach(function (x) {
      server.route(require('./' + x))
    })
  }
}
