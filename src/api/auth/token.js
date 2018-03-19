'use strict'

const P = require('bluebird')
const Moment = require('moment')
const UnauthorizedError = require('@mojaloop/central-services-auth').UnauthorizedError
const Crypto = require('../../lib/crypto')
const DfspService = require('../../domain/dfsp')
const TokenService = require('../../domain/token')

const validateToken = (token, bearer) => {
  const expired = token.expiration && (token.expiration < Moment.utc().valueOf())
  return !expired && Crypto.verify(token.token, bearer)
}

const getDfsp = (name) => {
  return DfspService.getByName(name)
}

const validate = async (request, token, h) => {
  const headers = request.headers
  const apiKey = headers['directory-api-key']
  if (!apiKey) {
    throw new UnauthorizedError('"Directory-Api-Key" header is required')
  }

  const dfsp = await getDfsp(apiKey)
  if (!dfsp) {
    throw new UnauthorizedError('"Directory-Api-Key" header is not valid')
  }

  const results = await TokenService.byDfsp(dfsp)
  if (!results || results.length === 0) {
    return h.response({isValid: false, credentials: null})
  }
  const result = await P.all(results.map(x => validateToken(x, token)))
    .then(verifications => verifications.some(x => x))
    .then(verified => h.response({isValid: verified, credentials: dfsp}))
  return result
}

module.exports = {
  name: 'bearer',
  scheme: 'bearer-access-token',
  validate
}
