'use strict'

const Config = require('../../lib/config')

const validate = (request, username, password, callback) => {
  const verified = (Config.ADMIN_KEY && Config.ADMIN_SECRET && username === Config.ADMIN_KEY && password === Config.ADMIN_SECRET)
  const credentials = { name: 'admin' }
  callback(null, verified, credentials)
}

module.exports = {
  name: 'admin',
  scheme: 'basic',
  validate
}
