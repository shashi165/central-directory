'use strict'

const P = require('bluebird')
const Crypto = require('../../lib/crypto')
const Config = require('../../lib/config')
const DfspService = require('../../domain/dfsp')

const verifyHash = (dfsp, password) => {
  if (!dfsp) {
    return P.resolve(false)
  }
  return Crypto.verify(dfsp.secretHash, password)
}

const validate = (request, name, password, cb) => {
  if (Config.ADMIN_KEY && Config.ADMIN_SECRET && name === Config.ADMIN_KEY && password === Config.ADMIN_SECRET) {
    return cb(null, true, { name: Config.ADMIN_KEY })
  }

  DfspService.getByName(name)
    .then(dfsp => verifyHash(dfsp, password)
        .then(verified => cb(null, verified, dfsp))
    )
}

module.exports = {
  name: 'dfsp',
  scheme: 'basic',
  validate
}
