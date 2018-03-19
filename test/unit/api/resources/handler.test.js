'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Shared = require('@mojaloop/central-services-shared')
const NotFoundError = Shared.NotFoundError
const Config = require(`${src}/lib/config`)
const DfspService = require(`${src}/domain/dfsp`)
const Validator = require(`${src}/api/resources/validator`)
const Handler = require(`${src}/api/resources/handler`)

Test('resource handler', handlerTest => {
  let sandbox
  let oldSchemeId
  let schemeId = '002'

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Validator, 'get')
    sandbox.stub(DfspService, 'getByDfspSchemeIdentifier')
    sandbox.stub(DfspService, 'getDefaultDfsp')
    oldSchemeId = Config.SCHEME_ID
    Config.SCHEME_ID = schemeId
    t.end()
  })

  handlerTest.afterEach(t => {
    sandbox.restore()
    Config.SCHEME_ID = oldSchemeId
    t.end()
  })

  handlerTest.test('get should', getTest => {
    getTest.test('reply with validator error', async test => {
      let error = new Error('some error')
      Validator.get.returns(P.reject(error))
      let request = { query: {} }

      try {
        await Handler.get(request, {})
      } catch (err) {
        test.equal(err, error)
        test.end()
      }
    })

    getTest.test('find identifier in returned directory', test => {
      let findStub = sandbox.stub()
      let identifier = '12345'
      let identifierType = 'eur'
      let directory = {
        find: findStub
      }

      let request = {
        query: {
          identifier: `${identifierType}:${identifier}`
        }
      }

      Validator.get.returns(P.resolve({
        directory,
        identifier,
        identifierType
      }))

      let dfsp = { name: 'name', shortName: 'shortName', dfspSchemeIdentifier: '123', url: 'http://test.com/dfsp1', primary: false }
      let findResult = [{ identifier, schemeIdentifier: schemeId, dfspSchemeIdentifier: dfsp.dfspSchemeIdentifier, primary: false }]

      DfspService.getByDfspSchemeIdentifier.withArgs(dfsp.dfspSchemeIdentifier).returns(P.resolve(dfsp))
      findStub.withArgs(identifier).yields(null, findResult)

      let reply = (actual) => {
        test.deepEqual(actual, [{ name: dfsp.name, shortName: dfsp.shortName, primary: false, registered: true, providerUrl: dfsp.url }])
        test.end()
      }

      Handler.get(request, reply)
    })

    getTest.test('find identifier in returned directory', test => {
      let findStub = sandbox.stub()
      let identifier = '12345'
      let identifierType = 'eur'
      let directory = {
        find: findStub
      }

      let request = {
        query: {
          identifier: `${identifierType}:${identifier}`
        }
      }

      Validator.get.returns(P.resolve({
        directory,
        identifier,
        identifierType
      }))

      let dfsp = { name: 'name', shortName: 'shortName', dfspSchemeIdentifier: '123', url: 'http://test.com/dfsp1', primary: false }
      let findResult = [{ identifier, schemeIdentifier: schemeId, dfspSchemeIdentifier: dfsp.dfspSchemeIdentifier }]

      DfspService.getByDfspSchemeIdentifier.withArgs(dfsp.dfspSchemeIdentifier).returns(P.resolve(dfsp))
      findStub.withArgs(identifier).yields(null, findResult)

      let reply = (actual) => {
        test.deepEqual(actual, [{ name: dfsp.name, shortName: dfsp.shortName, primary: false, registered: true, providerUrl: dfsp.url }])
        test.end()
      }

      Handler.get(request, reply)
    })

    getTest.test('filter out DFSPs that are not found by DFSP scheme identifier', test => {
      let findStub = sandbox.stub()
      let identifier = '12345'
      let identifierType = 'eur'
      let directory = {
        find: findStub
      }

      let request = {
        query: {
          identifier: `${identifierType}:${identifier}`
        }
      }

      Validator.get.returns(P.resolve({
        directory,
        identifier,
        identifierType
      }))

      let dfsp = { name: 'name', shortName: 'shortName', dfspSchemeIdentifier: '123', url: 'http://test.com/dfsp1', primary: true }
      let dfsp2 = { name: 'name2', shortName: 'shortName2', dfspSchemeIdentifier: '124', url: 'http://test.com/dfsp2', primary: false }
      let findResult = [{ identifier, schemeIdentifier: schemeId, dfspSchemeIdentifier: dfsp.dfspSchemeIdentifier, primary: dfsp.primary }, { identifier, schemeIdentifier: schemeId, dfspSchemeIdentifier: dfsp2.dfspSchemeIdentifier, primary: dfsp2.primary }]

      DfspService.getByDfspSchemeIdentifier.withArgs(dfsp.dfspSchemeIdentifier).returns(P.resolve(dfsp))
      DfspService.getByDfspSchemeIdentifier.withArgs(dfsp2.dfspSchemeIdentifier).returns(P.resolve(null))
      findStub.withArgs(identifier).yields(null, findResult)

      let reply = (actual) => {
        test.deepEqual(actual, [{ name: dfsp.name, shortName: dfsp.shortName, primary: dfsp.primary, registered: true, providerUrl: dfsp.url }])
        test.end()
      }

      Handler.get(request, reply)
    })

    getTest.test('throw NotFoundException if not configured scheme identifier', test => {
      let findStub = sandbox.stub()
      let identifier = '12345'
      let identifierType = 'eur'
      let directory = {
        find: findStub
      }

      let request = {
        query: {
          identifier: `${identifierType}:${identifier}`
        }
      }

      Validator.get.returns(P.resolve({
        directory,
        identifier,
        identifierType
      }))

      let findResult = [{ identifier, schemeIdentifier: '001', dfspSchemeIdentifier: '123' }]
      findStub.withArgs(identifier).yields(null, findResult)

      let reply = (e) => {
        test.ok(e instanceof NotFoundError)
        test.equal(e.message, 'Cross-scheme lookups are not currently supported')
        test.end()
      }

      Handler.get(request, reply)
    })

    getTest.test('return a default dfsp if directory yields empty and a default dfsp exists', test => {
      let findStub = sandbox.stub()
      let identifier = 'id'
      let directory = {
        find: findStub
      }
      let dfsp = { dfspSchemeIdentifier: '123', url: 'http://test.com/dfsp1' }
      let err = new NotFoundError('The requested identifier could not be found')
      err.status = 404

      findStub.yields(err, null)

      DfspService.getDefaultDfsp.returns(P.resolve(dfsp))

      Validator.get.returns(P.resolve({
        identifier,
        directory
      }))

      let reply = (res) => {
        test.ok(res[0].providerUrl, dfsp.url)
        test.equal(res[0].registered, false)
        test.end()
      }

      Handler.get({ query: {} }, reply)
    })

    getTest.test('throw error from directory if directory throws', test => {
      let findStub = sandbox.stub()
      let identifier = 'id'
      let directory = {
        find: findStub
      }

      let error = new Error('There was an error')
      findStub.yields(error)

      Validator.get.returns(P.resolve({
        identifier,
        directory
      }))

      let reply = (e) => {
        test.ok(e instanceof Error)
        test.equal(e.message, 'There was an error')
        test.end()
      }

      Handler.get({ query: {} }, reply)
    })

    getTest.end()
  })

  handlerTest.test('registerIdentifier should', registerIdentifierTest => {
    registerIdentifierTest.test('reply with validator error', test => {
      let error = new Error('some error')
      Validator.get.returns(P.reject(error))
      let request = {
        payload: {
          identifier: '1'
        },
        auth: {
          credentials: {
            dfspSchemeIdentifier: '1'
          }
        }
      }
      let reply = (e) => {
        test.equal(e, error)
        test.end()
      }

      Handler.registerIdentifier(request, reply)
    })

    registerIdentifierTest.test('register identifier in returned directory', test => {
      let registerStub = sandbox.stub()
      let identifier = 'eur:123'

      let directory = {
        registerIdentifier: registerStub
      }

      let dfsp = { name: 'name', shortName: 'short', dfspSchemeIdentifier: '123', url: 'http://test.com/dfsp1', primary: false }
      let registerResult = { identifier, schemeIdentifier: '001', dfspSchemeIdentifier: dfsp.dfspSchemeIdentifier, primary: false }

      DfspService.getByDfspSchemeIdentifier.withArgs(dfsp.dfspSchemeIdentifier).returns(P.resolve(dfsp))

      registerStub.withArgs({ identifier, dfspSchemeIdentifier: dfsp.dfspSchemeIdentifier, primary: false }).yields(null, registerResult)

      let request = {
        payload: {
          identifier: identifier,
          primary: false
        },
        auth: {
          credentials: {
            dfspSchemeIdentifier: dfsp.dfspSchemeIdentifier
          }
        }
      }

      Validator.get.returns(P.resolve({
        identifier: identifier,
        directory: directory
      }))

      let reply = (actual) => {
        test.deepEqual(actual, { name: dfsp.name, shortName: dfsp.shortName, primary: false, registered: true, providerUrl: dfsp.url })
        test.end()
      }

      Handler.registerIdentifier(request, reply)
    })

    registerIdentifierTest.test('throw NotFoundException if directory yields empty', test => {
      let registerStub = sandbox.stub()
      let identifier = 'eur:123'
      let directory = {
        registerIdentifier: registerStub
      }
      registerStub.yields(null, null)
      let request = {
        payload: {
          identifier: identifier
        },
        auth: {
          credentials: {
            dfspSchemeIdentifier: '1'
          }
        }
      }
      Validator.get.returns(P.resolve({
        identifier,
        directory
      }))

      let reply = (e) => {
        test.ok(e instanceof Error)
        test.equal(e.message, 'The identifier could not be registered')
        test.end()
      }

      Handler.registerIdentifier(request, reply)
    })

    registerIdentifierTest.test('throw NotFoundException if directory throws', test => {
      let registerStub = sandbox.stub()
      let identifier = 'eur:123'
      let directory = {
        registerIdentifier: registerStub
      }
      let error = new Error('not the message i want')
      registerStub.yields(error)

      let request = {
        payload: {
          identifier: identifier
        },
        auth: {
          credentials: {
            dfspSchemeIdentifier: '1'
          }
        }
      }
      Validator.get.returns(P.resolve({
        identifier,
        directory
      }))

      let reply = (e) => {
        test.equal(e, error)
        test.end()
      }

      Handler.registerIdentifier(request, reply)
    })

    registerIdentifierTest.end()
  })

  handlerTest.end()
})
