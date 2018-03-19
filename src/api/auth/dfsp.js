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

const validate = async (request, name, password, h) => {
  if (Config.ADMIN_KEY && Config.ADMIN_SECRET && name === Config.ADMIN_KEY && password === Config.ADMIN_SECRET) {
    return {
      isValid: true,
      credentials: { name: Config.ADMIN_KEY }
    }
  }

  const dfsp = await DfspService.getByName(name)
  const verified = await verifyHash(dfsp, password)
  return {
    isValid: verified,
    credentials: dfsp
  }
}

module.exports = {
  name: 'dfsp',
  scheme: 'basic',
  validate
}
