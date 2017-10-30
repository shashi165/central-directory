'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const ApiModule = require('../../../src/api/index')

Test('Api module', apiModuleTest => {
  let sandbox

  apiModuleTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    t.end()
  })

  apiModuleTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  apiModuleTest.test('should be named "api"', test => {
    test.equal(ApiModule.register.attributes.name, 'api')
    test.end()
  })

  apiModuleTest.test('should register routes', test => {
    let server = {
      route: sandbox.stub()
    }

    let next = () => {
      test.ok(server.route.called)
      test.end()
    }

    ApiModule.register(server, {}, next)
  })
  apiModuleTest.end()
})
