'use strict'

const src = '../../../../src'
const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Moment = require('moment')
const Model = require(`${src}/domain/token/model`)
const Crypto = require(`${src}/lib/crypto`)
const Config = require(`${src}/lib/config`)
const TokenService = require(`${src}/domain/token`)

Test('Token Service', serviceTest => {
  let sandbox
  let originalTokenExpiration

  serviceTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Crypto)
    sandbox.stub(Model)
    sandbox.stub(Moment, 'utc')
    originalTokenExpiration = Config.TOKEN_EXPIRATION
    test.end()
  })

  serviceTest.afterEach(test => {
    sandbox.restore()
    Config.TOKEN_EXPIRATION = originalTokenExpiration
    test.end()
  })

  serviceTest.test('create should', createTest => {
    createTest.test('generate token and save hash to model', test => {
      const dfspId = 1234
      const dfsp = { dfspId }
      const token = 'token'
      const tokenHash = 'tokenHash'
      const encodedTokenHash = tokenHash

      Crypto.generateToken.returns(P.resolve(token))
      Crypto.hash.withArgs(token).returns(P.resolve(tokenHash))
      Model.create.returns(P.resolve({ dfspId, token: encodedTokenHash }))

      TokenService.create(dfsp)
        .then(result => {
          test.equal(result.token, token)
          test.ok(Model.create.calledWith(Sinon.match({ dfspId, token: encodedTokenHash })))
          test.end()
        })
    })
    createTest.end()
  })

  serviceTest.test('create should', createTest => {
    createTest.test('generate expiration if Config.TOKEN_EXPIRATION is set', test => {
      const dfspId = 1234
      const dfsp = { dfspId }
      const token = 'token'
      const tokenHash = 'tokenHash'
      const encodedTokenHash = tokenHash

      Crypto.generateToken.returns(P.resolve(token))
      Crypto.hash.withArgs(token).returns(P.resolve(tokenHash))

      const currentTime = Moment()
      const tokenExpiration = 1000
      const tokenExpires = currentTime.valueOf() + tokenExpiration

      Moment.utc.returns(currentTime)
      Config.TOKEN_EXPIRATION = tokenExpiration

      Model.create.returns(P.resolve({ dfspId, token: encodedTokenHash, expiration: tokenExpires }))

      TokenService.create(dfsp)
        .then(result => {
          test.ok(Model.create.calledWith(Sinon.match({ dfspId, token: encodedTokenHash, expiration: tokenExpires })))
          test.end()
        })
    })

    createTest.test('create non expiring token if Config.TOKEN_EXPIRATION not set', test => {
      const dfspId = 1234
      const dfsp = { dfspId }
      const token = 'token'
      const tokenHash = 'tokenHash'
      const encodedTokenHash = tokenHash

      Crypto.generateToken.returns(P.resolve(token))
      Crypto.hash.withArgs(token).returns(P.resolve(tokenHash))
      Config.TOKEN_EXPIRATION = null

      Model.create.returns(P.resolve({}))

      TokenService.create(dfsp)
        .then(result => {
          test.ok(Model.create.calledWith(Sinon.match({ dfspId, token: encodedTokenHash, expiration: null })))
          test.end()
        })
    })

    createTest.end()
  })

  serviceTest.test('byDfsp should', byAccountTest => {
    byAccountTest.test('return byDfsp from Model', test => {
      const dfspId = 1
      const dfsp = { dfspId }
      Model.byDfsp.returns(P.resolve([]))
      TokenService.byDfsp(dfsp)
        .then(result => {
          test.ok(Model.byDfsp.calledWith(Sinon.match({ dfspId })))
          test.end()
        })
    })

    byAccountTest.end()
  })

  serviceTest.test('removeExpired should', removeExpiredTest => {
    removeExpiredTest.test('remove expired tokens', test => {
      Model.removeExpired.returns(P.resolve([]))
      TokenService.removeExpired()
        .then(result => {
          test.equal(Model.removeExpired.callCount, 1)
          test.end()
        })
    })

    removeExpiredTest.end()
  })

  serviceTest.end()
})
