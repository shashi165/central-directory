'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Db = require('../../../../src/db')
const Model = require('../../../../src/domain/dfsp/model')

Test('dfsp model', modelTest => {
  let sandbox

  modelTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()

    Db.dfsps = {
      insert: sandbox.stub(),
      findOne: sandbox.stub(),
      count: sandbox.stub()
    }

    t.end()
  })

  modelTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  modelTest.test('getByName should', getByNameTest => {
    getByNameTest.test('query dfsp by name', test => {
      let name = 'name'
      let dfsp = {}

      Db.dfsps.findOne.returns(P.resolve(dfsp))

      Model.getByName(name)
        .then(result => {
          test.equal(result, dfsp)
          test.ok(Db.dfsps.findOne.calledWith(Sinon.match({ name })))
          test.end()
        })
    })

    getByNameTest.end()
  })

  modelTest.test('getByDfspSchemeIdentifier should', getByIdentifierTest => {
    getByIdentifierTest.test('query dfsp by dfspSchemeIdentifier', test => {
      let dfspSchemeIdentifier = '123'
      let dfsp = {}

      Db.dfsps.findOne.returns(P.resolve(dfsp))

      Model.getByDfspSchemeIdentifier(dfspSchemeIdentifier)
        .then(result => {
          test.equal(result, dfsp)
          test.ok(Db.dfsps.findOne.calledWith(Sinon.match({ dfspSchemeIdentifier })))
          test.end()
        })
    })

    getByIdentifierTest.end()
  })

  modelTest.test('create should', createTest => {
    createTest.test('save dfsp to database', test => {
      let name = 'dfsp1'
      let shortName = 'd1'
      let key = 'dfsp1Key'
      let hash = 'dfsp1Hash'
      let dfsp = {}

      Db.dfsps.insert.returns(P.resolve(dfsp))

      Model.create({ name: name, shortName: shortName, key: key, secretHash: hash })
        .then(result => {
          test.equal(result, dfsp)
          test.ok(Db.dfsps.insert.calledWith(Sinon.match({
            name: name,
            key: key,
            secretHash: hash
          })))
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.end()
})
