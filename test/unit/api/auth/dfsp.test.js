'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Crypto = require(`${src}/lib/crypto`)
const Config = require(`${src}/lib/config`)
const DfspService = require(`${src}/domain/dfsp`)
const DfspAuth = require(`${src}/api/auth/dfsp`)

const request = {}

Test('dfsp auth', authTest => {
  let sandbox
  let adminKey = 'adminTest'
  let adminSecret = 'adminTest'
  let oldAdminKey
  let oldAdminSecret

  authTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(DfspService, 'getByName')
    sandbox.stub(Crypto, 'verify')

    oldAdminKey = Config.ADMIN_KEY
    oldAdminSecret = Config.ADMIN_SECRET

    Config.ADMIN_KEY = adminKey
    Config.ADMIN_SECRET = adminSecret

    t.end()
  })

  authTest.afterEach(t => {
    sandbox.restore()

    Config.ADMIN_KEY = oldAdminKey
    Config.ADMIN_SECRET = oldAdminSecret

    t.end()
  })

  authTest.test('name should', nameTest => {
    nameTest.test('be "dfsp"', test => {
      test.equal(DfspAuth.name, 'dfsp')
      test.end()
    })
    nameTest.end()
  })

  authTest.test('scheme should', schemeTest => {
    schemeTest.test('be "basic"', test => {
      test.equal(DfspAuth.scheme, 'basic')
      test.end()
    })
    schemeTest.end()
  })

  authTest.test('validate should', validateTest => {
    validateTest.test('return invalid if dfsp does not exist', async test => {
      DfspService.getByName.returns(P.resolve(null))

      const response = await DfspAuth.validate(request, '', '', {})
      test.equal(response.isValid, false)
      test.end()
    })

    validateTest.test('return true if user is configured admin', async test => {
      const response = await DfspAuth.validate(request, adminKey, adminSecret, {})
      test.equal(response.isValid, true)
      test.equal(response.credentials.name, adminKey)
      test.equal(await DfspService.getByName.callCount, 0)
      test.end()
    })

    validateTest.test('return invalid if dfsp secret hash does not match password', async test => {
      let password = 'password'
      let dfsp = {
        name: 'dfsp1',
        secretHash: 'secret-hash'
      }

      DfspService.getByName.withArgs(dfsp.name).returns(P.resolve(dfsp))
      Crypto.verify.withArgs(dfsp.secretHash, password).returns(P.resolve(false))

      const response = await DfspAuth.validate(request, dfsp.name, password, {})
      test.ok(await Crypto.verify.calledOnce)
      test.equal(response.isValid, false)
      test.end()
    })

    validateTest.test('return valid dfsp if secret hash matches password', async test => {
      let password = 'password'
      let dfsp = {
        name: 'dfsp1',
        secretHash: 'secret-hash',
        key: 'dfsp1-key'
      }

      DfspService.getByName.withArgs(dfsp.name).returns(P.resolve(dfsp))
      Crypto.verify.withArgs(dfsp.secretHash, password).returns(P.resolve(true))

      const response = await DfspAuth.validate(request, dfsp.name, password, {})
      test.ok(await Crypto.verify.calledOnce)
      test.equal(response.isValid, true)
      test.deepEqual(response.credentials, dfsp)
      test.end()
    })

    validateTest.end()
  })

  authTest.end()
})
