'use strict'

const Moment = require('moment')
const Model = require('./model')
const Crypto = require('../../lib/crypto')
const Config = require('../../lib/config')

const hashToken = (token) => {
  return Crypto.hash(token).then(tokenHash => ({ token, tokenHash }))
}

const generateToken = () => {
  return Crypto.generateToken().then(hashToken)
}

const getTokenExpiration = () => {
  return Config.TOKEN_EXPIRATION ? Moment.utc().add(Config.TOKEN_EXPIRATION, 'ms').valueOf() : null
}

const create = ({ dfspId }) => {
  return generateToken().then(result => {
    return Model.create({ dfspId, token: result.tokenHash, expiration: getTokenExpiration() })
      .then(() => ({ token: result.token }))
  })
}

const byDfsp = ({ dfspId }) => {
  return Model.byDfsp({ dfspId })
}

const removeExpired = () => {
  return Model.removeExpired()
}

module.exports = {
  create,
  byDfsp,
  removeExpired
}
