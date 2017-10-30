'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const AlreadyExistsError = require('../../../../src/errors/already-exists-error')
const Crypto = require('../../../../src/lib/crypto')
const Model = require('../../../../src/domain/dfsp/model')
const Service = require('../../../../src/domain/dfsp')
const Config = require(`../../../../src/lib/config`)

Test('dfsp service', serviceTest => {
  let sandbox
  let oldDefaultDfsp
  let defaultDfsp = 'dfsp1'

  serviceTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Model, 'create')
    sandbox.stub(Model, 'getByName')
    sandbox.stub(Model, 'getByDfspSchemeIdentifier')
    sandbox.stub(Crypto, 'hash')
    oldDefaultDfsp = Config.DEFAULT_DFSP
    Config.DEFAULT_DFSP = defaultDfsp
    t.end()
  })

  serviceTest.afterEach(t => {
    sandbox.restore()
    Config.DEFAULT_DFSP = oldDefaultDfsp
    t.end()
  })

  serviceTest.test('create should', createTest => {
    createTest.test('throw AlreadyExistsExcpetion if dfsp name exists', test => {
      let name = 'dfsp1'
      Model.getByName.withArgs(name).returns(P.resolve({}))

      Service.create(name)
        .then(r => {
          test.fail('Expected exception to be thrown')
          test.end()
        })
        .catch(AlreadyExistsError, e => {
          test.equal(e.message, 'Duplicate DFSP definition')
          test.pass()
          test.end()
        })
    })

    createTest.test('throw Error creating scheme identifier', test => {
      let name = 'dfsp1'
      let shortName = 'dfsp1'
      let error = new Error('Error generating DFSP scheme identifier')
      let hash = 'some-hash'

      Crypto.hash.withArgs(name).returns(hash)
      Model.getByName.returns(P.resolve(null))
      Model.create.throws(error)

      Service.create(name, shortName)
        .then(r => {
          test.fail('Expected exception to be thrown')
          test.end()
        })
        .catch(Error, e => {
          test.equal(e.message, 'Error generating DFSP scheme identifier')
          test.pass()
          test.end()
        })
    })

    createTest.test('create dfsp in model', test => {
      let name = 'dfsp1'
      let shortName = 'dfsp1'
      let created = {}
      let hash = 'some-hash'
      let url = 'http://test.com'

      Crypto.hash.withArgs(name).returns(hash)
      Model.getByName.returns(P.resolve(null))
      Model.create.returns(created)

      Service.create(name, shortName, url)
        .then(result => {
          test.ok(Model.create.calledWith(Sinon.match({
            name: name,
            shortName: shortName,
            key: name,
            secretHash: hash,
            url
          })))
          test.equal(3, Model.create.firstCall.args[0].dfspSchemeIdentifier.length)
          test.end()
        })
    })

    createTest.test('return created dfsp', test => {
      let name = 'dfsp1'
      let shortName = 'dfsp1'
      let hash = 'hash'
      let created = { name, key: name, secretHash: hash }

      Crypto.hash.returns(hash)
      Model.getByName.returns(P.resolve(null))
      Model.create.returns(P.resolve(created))

      Service.create(name, shortName)
        .then(result => {
          test.deepEqual(result, created)
          test.end()
        })
    })

    createTest.end()
  })

  serviceTest.test('getByName should', getByNameTest => {
    getByNameTest.test('return dfsp from repo by name', test => {
      let dfspName = 'dfsp1'
      let dfsp = { name: dfspName }
      Model.getByName.withArgs(dfspName).returns(P.resolve(dfsp))

      Service.getByName(dfspName)
        .then(result => {
          test.equal(result, dfsp)
          test.end()
        })
    })

    getByNameTest.end()
  })

  serviceTest.test('getByDfspSchemeIdentifier should', getByDfspSchemeIdentifierTest => {
    getByDfspSchemeIdentifierTest.test('return dfsp from repo by dfspSchemeIdentifier', test => {
      let dfspSchemeIdentifier = '123'
      let dfsp = { name: 'name', shortName: 'shortName', url: 'url' }
      Model.getByDfspSchemeIdentifier.withArgs(dfspSchemeIdentifier).returns(P.resolve(dfsp))

      Service.getByDfspSchemeIdentifier(dfspSchemeIdentifier)
        .then(result => {
          test.equal(result.name, dfsp.name)
          test.equal(result.shortName, dfsp.shortName)
          test.equal(result.url, dfsp.url)
          test.end()
        })
    })

    getByDfspSchemeIdentifierTest.end()
  })

  serviceTest.test('getDefaultDfsp should', getDefaultDfspTest => {
    getDefaultDfspTest.test('return the default dfsp from the repo', test => {
      let dfspName = Config.DEFAULT_DFSP
      let dfsp = { name: dfspName, shortName: 'shortName', url: 'url' }
      Model.getByName.returns(P.resolve(dfsp))

      Service.getDefaultDfsp()
        .then(result => {
          test.deepEqual(result.name, dfsp.name)
          test.deepEqual(result.shortName, dfsp.shortName)
          test.deepEqual(result.url, dfsp.url)
          test.end()
        })
    })

    getDefaultDfspTest.test('throw internal error when no default dfsp set', test => {
      Config.DEFAULT_DFSP = undefined

      Service.getDefaultDfsp()
        .then(r => {
          test.fail('Expected exception to be thrown')
          test.end()
        })
        .catch(Error, e => {
          test.equal(e.message, 'Error retrieving DFSP.')
          test.pass()
          test.end()
        })
    })

    getDefaultDfspTest.test('return the default dfsp from the repo', test => {
      Model.getByName.returns(P.resolve(null))

      Service.getDefaultDfsp()
        .then(r => {
          test.fail('Expected exception to be thrown')
          test.end()
        })
        .catch(Error, e => {
          test.equal(e.message, 'Error retrieving DFSP.')
          test.pass()
          test.end()
        })
    })

    getDefaultDfspTest.end()
  })

  serviceTest.end()
})
