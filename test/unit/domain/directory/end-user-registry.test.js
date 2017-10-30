'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Request = require('superagent')
const AlreadyExistsError = require('../../../../src/errors/already-exists-error')
const InvalidResponseError = require('../../../../src/errors/invalid-response-error')
const Shared = require('@mojaloop/central-services-shared')
const NotFoundError = Shared.NotFoundError
const BadRequestError = require('../../../../src/errors/bad-request-error')
const Registry = require('../../../../src/domain/directory/end-user-registry')
const Config = require('../../../../src/lib/config')

Test('End user registry tests', eurTest => {
  let sandbox
  let oldSchemeId
  let schemeId = '010'

  eurTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Request, 'get')
    sandbox.stub(Request, 'post')

    oldSchemeId = Config.SCHEME_ID
    Config.SCHEME_ID = schemeId

    test.end()
  })

  eurTest.afterEach(test => {
    sandbox.restore()
    Config.SCHEME_ID = oldSchemeId
    test.end()
  })

  eurTest.test('identifierType should be "eur"', test => {
    test.equal(Registry.identifierType, 'eur')
    test.end()
  })

  eurTest.test('decription', test => {
    test.equal(Registry.description, 'End User Registry number')
    test.end()
  })

  eurTest.test('find should', findTest => {
    findTest.test('call registry endpoint and return stored data', test => {
      const baseUrl = Config.END_USER_REGISTRY_URL
      const number = '12345'
      const dfspSchemeIdentifier = '123'
      const dfspIdentifier = `${schemeId}:${dfspSchemeIdentifier}`

      const reply = { body: [{ number, dfspIdentifier }] }
      Request.get.yields(null, reply)

      Registry.find(number, (err, res) => {
        test.notOk(err)
        test.ok(Request.get.calledWith(`${baseUrl}/users/${number}`))
        test.equal(1, res.length)
        test.equal(res[0].identifier, number)
        test.equal(res[0].schemeIdentifier, schemeId)
        test.equal(res[0].dfspSchemeIdentifier, dfspSchemeIdentifier)
        test.end()
      })
    })

    findTest.test('return NotFoundError if request returns NotFoundError', test => {
      const error = new NotFoundError('The requested identifier could not be found')
      error.status = 404
      Request.get.yields(error)
      Registry.find('1234', (err, res) => {
        test.equal(err.name, error.name)
        test.equal(err.payload.message, error.payload.message)
        test.end()
      })
    })

    findTest.test('return BadRequestError if request returns BadRequestError', test => {
      const error = new BadRequestError('Error validating one or more uri parameters')
      error.status = 400
      error.response = { body: { message: 'Error validating one or more uri parameters' } }

      Request.get.yields(error)
      Registry.find('1234', (err, res) => {
        test.equal(err.name, error.name)
        test.equal(err.payload.message, error.response.body.message)
        test.end()
      })
    })

    findTest.test('return error if request returns error', test => {
      const error = new Error()
      Request.get.yields(error)
      Registry.find('1234', (err, res) => {
        test.equal(err, error)
        test.end()
      })
    })

    findTest.test('return InvalidResponseError if request returns undefined response', test => {
      const error = new InvalidResponseError('There was an issue processing the request.')
      Request.get.yields(undefined, undefined)
      Registry.find('1234', (err, res) => {
        test.deepEqual(err, error)
        test.end()
      })
    })

    findTest.end()
  })

  eurTest.test('registerIdentifier should', registerTest => {
    registerTest.test('post to registry endpoint and return stored data', test => {
      const baseUrl = Config.END_USER_REGISTRY_URL
      const identifier = '12345'
      const dfspSchemeIdentifier = '123'
      const dfspIdentifier = `${schemeId}:${dfspSchemeIdentifier}`

      const reply = { body: { number: identifier, dfspIdentifier } }

      var send = sandbox.stub()
      var set = sandbox.stub()
      var end = sandbox.stub()
      end.yields(null, reply)
      set.returns({ end: end })
      send.returns({ set: set })
      Request.post.returns({ send: send })

      Registry.registerIdentifier({ identifier, dfspSchemeIdentifier }, (err, res) => {
        test.notOk(err)
        test.ok(Request.post.calledWith(`${baseUrl}/register`))
        test.ok(send.calledWith(Sinon.match({ number: identifier, dfspIdentifier })))
        test.equal(res.identifier, identifier)
        test.equal(res.schemeIdentifier, schemeId)
        test.equal(res.dfspSchemeIdentifier, dfspSchemeIdentifier)
        test.end()
      })
    })

    registerTest.test('return error if request returns error', test => {
      const error = new Error()

      const identifier = '1234'
      const dfspSchemeIdentifier = '1234'

      var send = sandbox.stub()
      var set = sandbox.stub()
      var end = sandbox.stub()
      end.yields(error)
      set.returns({ end: end })
      send.returns({ set: set })
      Request.post.returns({ send: send })

      Registry.registerIdentifier({ identifier, dfspSchemeIdentifier }, (err, res) => {
        test.equal(err, error)
        test.end()
      })
    })

    registerTest.test('return AlreadyExistsError if request returns same error', test => {
      const error = new Error()
      error.response = { body: { id: 'AlreadyExistsError' } }

      const identifier = '1234'
      const dfspSchemeIdentifier = '1234'

      var send = sandbox.stub()
      var set = sandbox.stub()
      var end = sandbox.stub()
      end.yields(error)
      set.returns({ end: end })
      send.returns({ set: set })
      Request.post.returns({ send: send })

      Registry.registerIdentifier({ identifier, dfspSchemeIdentifier }, (err, res) => {
        test.ok(err instanceof AlreadyExistsError)
        test.equal(err.message, 'The identifier has already been registered by this DFSP')
        test.end()
      })
    })

    registerTest.end()
  })

  eurTest.end()
})
