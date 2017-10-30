'use strict'

const Glob = require('glob')
const Registry = require('./registry')

const checkValidDirectory = (file) => {
  let dir = require(`./${file}`)
  if (dir.identifierType && dir.description) {
    return dir
  }
}

exports.register = (server, options, next) => {
  let found = Glob.sync('**/*.js', { cwd: __dirname }).map(checkValidDirectory).filter(x => x !== undefined)
  Registry.register.apply(this, found).then(() => next())
}

exports.register.attributes = {
  name: 'directory-registration'
}
