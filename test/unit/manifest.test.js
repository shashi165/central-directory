'use strict'

const Test = require('tapes')(require('tape'))
const Config = require('../../src/lib/config')
const Pack = require('../../package')
const Manifest = require('../../src/manifest')

Test('manifest', manifestTest => {
  manifestTest.test('connections should', connectionsTest => {
    connectionsTest.test('have connections section', test => {
      test.ok(Manifest.connections)
      test.end()
    })

    connectionsTest.test('have one connection with configured port', test => {
      test.equal(Manifest.connections.length, 1)
      test.equal(Manifest.connections[0].port, Config.PORT)
      test.end()
    })

    connectionsTest.end()
  })

  manifestTest.test('registrations should', registrationsTest => {
    registrationsTest.test('have registrations section', test => {
      test.ok(Manifest.registrations)
      test.end()
    })

    registrationsTest.test('register require plugins', test => {
      let plugins = ['inert', 'vision', 'blipp', '@mojaloop/central-services-error-handling', '@mojaloop/central-services-auth', './api/auth', './api', './domain/directory']
      plugins.forEach(p => {
        test.ok(findPluginByPath(Manifest.registrations, p))
      })
      test.end()
    })

    registrationsTest.test('register and configure good plugin', test => {
      let found = findPluginByRegisterName(Manifest.registrations, 'good')

      test.ok(found)
      test.equal(found.plugin.options.reporters.console.length, 3)
      test.equal(found.plugin.options.reporters.console[0].module, 'good-squeeze')
      test.equal(found.plugin.options.reporters.console[1].module, 'good-console')
      test.equal(found.plugin.options.reporters.console[2], 'stdout')
      test.end()
    })

    registrationsTest.test('register and configure hapi-swagger plugin', test => {
      let found = findPluginByRegisterName(Manifest.registrations, 'hapi-swagger')

      test.ok(found)
      test.equal(found.plugin.options.info.title, 'Central Directory API Documentation')
      test.equal(found.plugin.options.info.version, Pack.version)
      test.end()
    })

    registrationsTest.end()
  })

  manifestTest.end()
})

let findPluginByPath = (plugins, path) => {
  return plugins.find(p => {
    return p.plugin && (typeof p.plugin === 'string') && p.plugin === path
  })
}

let findPluginByRegisterName = (plugins, registerName) => {
  return plugins.find(p => {
    return p.plugin && (typeof p.plugin === 'object') && p.plugin.register && p.plugin.register === registerName
  })
}
