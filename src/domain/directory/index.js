'use strict'

const Glob = require('glob')
const Registry = require('./registry')

const checkValidDirectory = (file) => {
  let dir = require(`./${file}`)
  if (dir.identifierType && dir.description) {
    return dir
  }
}

exports.plugin = {
  register: function (server, options) {
    let found = Glob.sync('**/*.js', { cwd: __dirname }).map(checkValidDirectory).filter(x => x !== undefined)
    Registry.register.apply(this, found)
  },
  name: 'directory-registration'
}
