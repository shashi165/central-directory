'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Moment = require('moment')
const Model = require('../../../../src/domain/token/model')
const Db = require('../../../../src/db')

Test('tokens model', function (modelTest) {
  let sandbox

  modelTest.beforeEach((t) => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Moment, 'utc')

    Db.tokens = {
      insert: sandbox.stub(),
      find: sandbox.stub(),
      destroy: sandbox.stub()
    }

    t.end()
  })

  modelTest.afterEach((t) => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save payload and return new token', test => {
      const payload = { dfspId: 1, token: 'token', expiration: new Date().getTime() }
      const created = { tokenId: 1 }

      Db.tokens.insert.returns(P.resolve(created))

      Model.create(payload)
        .then(c => {
          let insertArg = Db.tokens.insert.firstCall.args[0]
          test.notEqual(insertArg, payload)
          test.equal(insertArg.dfspId, payload.dfspId)
          test.equal(insertArg.token, payload.token)
          test.equal(insertArg.expiration, payload.expiration)
          test.equal(c, created)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('byDfsp should', byDfspTest => {
    byDfspTest.test('return Model byDfsp', test => {
      const dfsp = { dfspId: 1 }
      const tokens = [ { dfspId: dfsp.dfspId, token: 'token1' }, { dfspId: dfsp.dfspId, token: 'token2' } ]

      Db.tokens.find.returns(P.resolve(tokens))

      Model.byDfsp(dfsp)
        .then(results => {
          test.equal(results, tokens)
          test.ok(Db.tokens.find.calledWith({ dfspId: dfsp.dfspId }))
          test.end()
        })
    })

    byDfspTest.end()
  })

  modelTest.test('removeExpired should', removeExpiredTest => {
    removeExpiredTest.test('remove expired tokens', test => {
      const now = Moment()
      Moment.utc.returns(now)

      const expiredTokens = [ { dfspId: 1, token: 'token', expiration: 1 } ]

      Db.tokens.destroy.returns(P.resolve(expiredTokens))

      Model.removeExpired()
        .then(removed => {
          test.equal(removed, expiredTokens)
          test.ok(Db.tokens.destroy.calledWith({ 'expiration <=': now.toISOString() }))
          test.end()
        })
    })

    removeExpiredTest.end()
  })

  modelTest.end()
})
