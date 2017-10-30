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

const validate = (request, token, cb) => {
  const headers = request.headers
  const apiKey = headers['directory-api-key']
  if (!apiKey) {
    return cb(new UnauthorizedError('"Directory-Api-Key" header is required'))
  }

  getDfsp(apiKey)
    .then(dfsp => {
      if (!dfsp) {
        return cb(new UnauthorizedError('"Directory-Api-Key" header is not valid'))
      }

      return TokenService.byDfsp(dfsp).then(results => {
        if (!results || results.length === 0) {
          return cb(null, false)
        }

        return P.all(results.map(x => validateToken(x, token)))
          .then(verifications => verifications.some(x => x))
          .then(verified => cb(null, verified, dfsp))
      })
    })
}

module.exports = {
  name: 'token',
  scheme: 'bearer',
  validate
}
