'use strict'

const Test = require('tapes')(require('tape'))
const RegistryPath = '../../../../src/domain/directory/registry'
const Server = require('../server')

Test('/resources', resourcesTest => {
  let fixtures

  resourcesTest.beforeEach(async t => {
    fixtures = await Server.setup()
    let registry = require(RegistryPath)
    registry.register(require('./stub-directory'))
    t.end()
  })

  resourcesTest.afterEach(t => {
    delete require.cache[require.resolve(RegistryPath)]
    fixtures.teardown()
    t.end()
  })

  resourcesTest.test('get should', getTest => {
    getTest.test('return error if identifier missing', async test => {
      let request = Server.request({ url: '/resources', headers: { 'Authorization': Server.basic('test', 'test') } })
      let response = await fixtures.server.inject(request)
      Server.assertInvalidQueryParameterError(test, response, 'child "identifier" fails because [identifier is required]')
      test.end()
    })

    getTest.test('return error if identifier missing', async test => {
      let request = await Server.request({ url: '/resources?', headers: { 'Authorization': Server.basic('test', 'test') } })
      const response = await fixtures.server.inject(request)
      Server.assertInvalidQueryParameterError(test, response, 'child "identifier" fails because [identifier is required]')
      test.end()
    })

    getTest.test('return error if identifierType is not registered', async test => {
      let request = await Server.request({ url: '/resources?identifier=not:1', headers: { 'Authorization': Server.basic('test', 'test') } })
      const response = await fixtures.server.inject(request)
      Server.assertInvalidQueryParameterError(test, response, 'child "identifier" fails because [identifier with value "not:1" fails to match the End User Registry number pattern, identifier with value "not:1" fails to match the E.164 telephone number pattern]')
      test.end()
    })

    getTest.end()
  })
  resourcesTest.end()
})
