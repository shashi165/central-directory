'use strict'

const Config = require('../../lib/config')

const validate = async (request, username, password, h) => {
  const verified = (Config.ADMIN_KEY && Config.ADMIN_SECRET && username === Config.ADMIN_KEY && password === Config.ADMIN_SECRET)
  if (!verified) {
    return { credentials: null, isValid: false }
  }

  const credentials = { name: 'admin' }
  return {
    credentials,
    isValid: verified
  }
}

module.exports = {
  name: 'simple',
  scheme: 'basic',
  validate
}
