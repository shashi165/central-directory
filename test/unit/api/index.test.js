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
    test.equal(ApiModule.plugin.name, 'api')
    test.end()
  })

  apiModuleTest.test('should register routes', async function (test) {
    let server = {
      route: sandbox.stub()
    }

    await ApiModule.plugin.register(server, {})
    test.ok(server.route.called)
    test.end()
  })
  apiModuleTest.end()
})
