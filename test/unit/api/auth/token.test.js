'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Moment = require('moment')
const UnauthorizedError = require('@mojaloop/central-services-auth').UnauthorizedError
const Crypto = require(`${src}/lib/crypto`)
const DfspService = require(`${src}/domain/dfsp`)
const TokenService = require(`${src}/domain/token`)
const TokenAuth = require(`${src}/api/auth/token`)

const createRequest = (apiKey = null) => {
  return {
    headers: {
      'directory-api-key': apiKey
    }
  }
}

Test('token auth', tokenTest => {
  let sandbox

  tokenTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(DfspService, 'getByName')
    sandbox.stub(TokenService, 'byDfsp')
    sandbox.stub(Crypto, 'verify')
    sandbox.stub(Moment, 'utc')
    test.end()
  })

  tokenTest.afterEach(test => {
    sandbox.restore()
    test.end()
  })

  tokenTest.test('name should', nameTest => {
    nameTest.test('be "token"', test => {
      test.equal(TokenAuth.name, 'token')
      test.end()
    })
    nameTest.end()
  })

  tokenTest.test('scheme should', schemeTest => {
    schemeTest.test('be "bearer"', test => {
      test.equal(TokenAuth.scheme, 'bearer')
      test.end()
    })
    schemeTest.end()
  })

  tokenTest.test('all token validate should', validateTest => {
    validateTest.test('be unauthorized if Directory-Api-Key header not set', test => {
      const request = createRequest()

      const cb = (err) => {
        test.ok(err)
        test.ok(err instanceof UnauthorizedError)
        test.equal(err.message, '"Directory-Api-Key" header is required')
        test.end()
      }

      TokenAuth.validate(request, 'token', cb)
    })

    validateTest.test('be unauthorized if Directory-Api-Key not found', test => {
      const name = 'some-name'
      DfspService.getByName.withArgs(name).returns(P.resolve(null))
      const request = createRequest(name)

      const cb = (err) => {
        test.ok(err)
        test.ok(err instanceof UnauthorizedError)
        test.equal(err.message, '"Directory-Api-Key" header is not valid')
        test.end()
      }

      TokenAuth.validate(request, 'token', cb)
    })

    validateTest.test('be invalid if token not found by dfsp', test => {
      const name = 'some-name'
      const dfspId = 5
      const dfsp = { dfspId }

      DfspService.getByName.withArgs(name).returns(P.resolve(dfsp))
      TokenService.byDfsp.withArgs(dfsp).returns(P.resolve([]))

      const request = createRequest(name)

      const cb = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      TokenAuth.validate(request, 'token', cb)
    })

    validateTest.test('be invalid if no dfsp tokens can be verified', test => {
      const name = 'some-name'
      const token = 'token'
      const dfspId = 4
      const dfsp = { dfspId }

      DfspService.getByName.withArgs(name).returns(P.resolve(dfsp))

      const tokens = [
        { token: 'bad-token1' },
        { token: 'bad-token2' }
      ]

      Crypto.verify.returns(P.resolve(false))

      TokenService.byDfsp.withArgs(dfsp).returns(P.resolve(tokens))

      const request = createRequest(name)

      const cb = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      TokenAuth.validate(request, token, cb)
    })

    validateTest.test('pass with account if one token can be verified', test => {
      const name = 'some-name'
      const token = 'token'
      const dfspId = 3
      const dfsp = { dfspId }

      DfspService.getByName.withArgs(name).returns(P.resolve(dfsp))

      const tokens = [
        { token: 'bad-token1' },
        { token: 'bad-token2' },
        { token }
      ]

      Crypto.verify.returns(P.resolve(false))
      Crypto.verify.withArgs(token).returns(P.resolve(true))

      TokenService.byDfsp.withArgs(dfsp).returns(P.resolve(tokens))

      const request = createRequest(name)

      const cb = (err, isValid, credentials) => {
        test.notOk(err)
        test.equal(isValid, true)
        test.equal(credentials, dfsp)
        test.end()
      }

      TokenAuth.validate(request, token, cb)
    })

    validateTest.test('be invalid if a token has expired', test => {
      const name = 'some-name'
      const tokenVal = 'token'

      const now = Moment()
      const expiration = now.valueOf() - 5000
      Moment.utc.returns(now)

      const token = { token: tokenVal, expiration }
      const bearer = 'bearer'
      const dfspId = 2
      const dfsp = { dfspId }

      DfspService.getByName.withArgs(name).returns(P.resolve(dfsp))

      const tokens = [
        token
      ]

      Crypto.verify.returns(P.resolve(false))
      Crypto.verify.withArgs(token.token, bearer).returns(P.resolve(true))

      TokenService.byDfsp.withArgs(dfsp).returns(P.resolve(tokens))

      const request = createRequest(name)

      const cb = (err, isValid, credentials) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.equal(credentials, dfsp)
        test.end()
      }

      TokenAuth.validate(request, bearer, cb)
    })

    validateTest.end()
  })

  tokenTest.end()
})
