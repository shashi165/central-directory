'use strict'

const Request = require('superagent')
const Config = require('../../lib/config')
const AlreadyExistsError = require('../../errors/already-exists-error')
const InvalidResponseError = require('../../errors/invalid-response-error')
const BadRequestError = require('../../errors/bad-request-error')
const NotFoundError = require('@mojaloop/central-services-shared').NotFoundError
const BaseUrl = Config.END_USER_REGISTRY_URL.replace(/\/$/, '')

const findResponse = (found) => {
  return found.map(userResponse)
}

const userResponse = (user, index = 0) => {
  const splitDfspIdentifier = user.dfspIdentifier.split(':')
  return {
    identifier: user.number,
    schemeIdentifier: splitDfspIdentifier[0],
    dfspSchemeIdentifier: splitDfspIdentifier[1],
    primary: index === 0
  }
}

module.exports = {
  identifierType: 'eur',
  description: 'End User Registry number',
  find: (identifier, callback) => {
    Request.get(`${BaseUrl}/users/${identifier}`, (err, res) => {
      if (err) {
        let error
        switch (err.status) {
          case 404:
            error = new NotFoundError('The requested identifier could not be found')
            break
          case 400:
            error = new BadRequestError(err.response.body.message)
            break
          default:
            error = err
        }
        return callback(error)
      }
      if (!res) {
        return callback(new InvalidResponseError('There was an issue processing the request.'))
      }
      return callback(null, findResponse(res.body))
    })
  },
  registerIdentifier: ({ identifier, dfspSchemeIdentifier }, callback) => {
    const dfspIdentifier = `${Config.SCHEME_ID}:${dfspSchemeIdentifier}`
    Request.post(`${BaseUrl}/register`).send({ number: identifier, dfspIdentifier }).set('Accept', 'application/json').end((err, res) => {
      if (err) {
        const e = (err.response && err.response.body.id === 'AlreadyExistsError') ? new AlreadyExistsError('The identifier has already been registered by this DFSP') : err
        return callback(e)
      }
      return callback(null, userResponse(res.body))
    })
  }
}
