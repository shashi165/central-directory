'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Registry = require('../../../../src/domain/directory/registry')
const Handler = require('../../../../src/api/identifier-types/handler')

Test('Handler test', typesTest => {
  let sandbox

  typesTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Registry, 'identifierTypes')
    t.end()
  })

  typesTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  typesTest.test('identifierTypes should', identifierTypesTest => {
    identifierTypesTest.test('reformat and return registered types', test => {
      let types = [{ identifierType: 'test type', description: 'type description' }]
      Registry.identifierTypes.returns(P.resolve(types))
      let reply = (result) => {
        test.equal(result.length, 1)
        test.equal(result[0]['identifierType'], 'test type')
        test.equal(result[0].description, 'type description')
        test.end()
      }

      Handler.identifierTypes({}, reply)
    })

    identifierTypesTest.test('reply with error if registered types fails', test => {
      const error = new Error()
      Registry.identifierTypes.returns(P.reject(error))
      let reply = (e) => {
        test.equal(e, error)
        test.end()
      }

      Handler.identifierTypes({}, reply)
    })

    identifierTypesTest.end()
  })
  typesTest.end()
})
