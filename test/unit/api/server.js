'use strict'

const Hapi = require('hapi')
const Sinon = require('sinon')
const ErrorHandling = require('@mojaloop/central-services-error-handling')
const DfspStrategy = require('../../../src/api/auth/dfsp')
const TokenStrategy = require('../../../src/api/auth/token')
const Encoding = require('@mojaloop/central-services-shared').Encoding
const Boom = require('boom')

let sandbox

async function setup () {
  sandbox = Sinon.sandbox.create()
  const fixtures = {
    teardown: () => {
      sandbox.restore()
    }
  }
  const server = await new Hapi.Server({
    port: 8000,
    routes: {
      validate: {
        options: ErrorHandling.validateRoutes(),
        failAction: async function (request, h, err) {
          throw Boom.boomify(err)
        }
      }
    }
  })

  sandbox.stub(DfspStrategy, 'validate')
  sandbox.stub(TokenStrategy, 'validate')
  DfspStrategy.validate.resolves({ isValid: true, credentials: {} })
  TokenStrategy.validate.resolves({ isValid: true, credentials: {} })

  await server.register([
    ErrorHandling,
    require('hapi-auth-basic'),
    require('@now-ims/hapi-now-auth'),
    require('hapi-auth-bearer-token'),
    require('../../../src/api/auth'),
    require('../../../src/api')
  ])

  fixtures.server = server

  return fixtures
}

let request = ({ url, method = 'GET', payload = '', headers = {} }) => {
  return { url: url, method: method, payload: payload, headers: headers }
}

let assertInvalidQueryParameterError = (test, response, messages) => {
  test.equal(response.statusCode, 400)
  test.equal(response.result.id, 'BadRequestError')
  test.equal(response.result.message, messages)
}

module.exports = {
  setup,
  request,
  assertInvalidQueryParameterError,
  basic: (username, password) => {
    return `Basic ${Encoding.toBase64(username + ':' + password)}`
  }
}
