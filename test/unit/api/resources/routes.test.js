'use strict'

const Test = require('tapes')(require('tape'))
const RegistryPath = '../../../../src/domain/directory/registry'
const Server = require('../server')

Test('/resources', resourcesTest => {
  let fixtures

  resourcesTest.beforeEach(t => {
    fixtures = Server.setup()
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
    getTest.test('return error if identifier missing', test => {
      let req = Server.request({ url: '/resources', headers: { 'Authorization': Server.basic('test', 'test') } })

      fixtures.server.inject(req, res => {
        Server.assertInvalidQueryParameterError(test, res, 'identifier is required')
        test.end()
      })
    })

    getTest.test('return error if identifier missing', test => {
      let req = Server.request({ url: '/resources?', headers: { 'Authorization': Server.basic('test', 'test') } })

      fixtures.server.inject(req, res => {
        Server.assertInvalidQueryParameterError(test, res, 'identifier is required')
        test.end()
      })
    })

    getTest.test('return error if identifierType is not registered', test => {
      let req = Server.request({ url: '/resources?identifier=not:1', headers: { 'Authorization': Server.basic('test', 'test') } })

      fixtures.server.inject(req, res => {
        Server.assertInvalidQueryParameterError(test, res, 'identifier with value "not:1" fails to match the End User Registry number pattern', 'identifier with value "not:1" fails to match the E.164 telephone number pattern')
        test.end()
      })
    })

    getTest.end()
  })
  resourcesTest.end()
})

