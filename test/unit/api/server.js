'use strict'

const Hapi = require('hapi')
const Sinon = require('sinon')
const ErrorHandling = require('@mojaloop/central-services-error-handling')
const Auth = require('@mojaloop/central-services-auth')
const DfspStrategy = require('../../../src/api/auth/dfsp')
const TokenStrategy = require('../../../src/api/auth/token')
const Encoding = require('@mojaloop/central-services-shared').Encoding

let sandbox

function setup () {
  sandbox = Sinon.sandbox.create()
  const fixtures = {
    teardown: () => {
      sandbox.restore()
    }
  }

  const server = new Hapi.Server()
  server.connection({
    port: 8000,
    routes: {
      validate: ErrorHandling.validateRoutes()
    }
  })

  sandbox.stub(DfspStrategy, 'validate')
  sandbox.stub(TokenStrategy, 'validate')
  DfspStrategy.validate.yields(null, true, {})
  TokenStrategy.validate.yields(null, true, {})

  server.register([
    ErrorHandling,
    Auth,
    require('../../../src/api/auth'),
    require('../../../src/api')
  ])

  fixtures.server = server

  return fixtures
}

let request = ({url, method = 'GET', payload = '', headers = {}}) => {
  return { url: url, method: method, payload: payload, headers: headers }
}

let assertInvalidQueryParameterError = (test, response, ...messages) => {
  test.equal(response.statusCode, 400)
  test.equal(response.result.id, 'InvalidQueryParameterError')
  test.equal(response.result.message, 'Error validating one or more query parameters')
  test.deepEqual(response.result.validationErrors.map(d => d.message), messages)
}

module.exports = {
  setup,
  request,
  assertInvalidQueryParameterError,
  basic: (username, password) => {
    return `Basic ${Encoding.toBase64(username + ':' + password)}`
  }
}
