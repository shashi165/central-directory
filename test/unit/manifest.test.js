'use strict'

const Test = require('tapes')(require('tape'))
const Config = require('../../src/lib/config')
const Pack = require('../../package')

let getManifest = () => {
  return require('../../src/manifest')
}

Test('manifest', function (manifestTest) {
  manifestTest.beforeEach(t => {
    t.end()
  })

  manifestTest.afterEach(t => {
    delete require.cache[require.resolve('../../src/manifest')]
    t.end()
  })

  manifestTest.test('should', function (connectionsTest) {
    connectionsTest.test('have server section', function (assert) {
      let Manifest = getManifest()
      assert.ok(Manifest.server)
      assert.end()
    })

    connectionsTest.test('have one server with configured port', function (assert) {
      let Manifest = getManifest()
      assert.equal(typeof Manifest.server, 'object')
      assert.equal(Manifest.server.port, Config.PORT)
      assert.end()
    })

    connectionsTest.test('have server validation fail action throwing Boom serverError', async function (assert) {
      let Manifest = getManifest()
      try {
        let _
        await Manifest.server.routes.validate.failAction(_, _, new Error('boomify'))
      } catch (err) {
        assert.equal(err.message, 'boomify')
        assert.equal(err.output.statusCode, 500)
        assert.equal(err.output.payload.error, 'Internal Server Error')
      }
      assert.end()
    })

    connectionsTest.end()
  })

  manifestTest.test('should', function (registrationsTest) {
    let Manifest

    registrationsTest.beforeEach(t => {
      Manifest = getManifest()
      t.end()
    })

    registrationsTest.test('register require plugins', test => {
      let plugins = ['inert', 'vision', 'blipp', '@mojaloop/central-services-error-handling', 'hapi-auth-basic', '@now-ims/hapi-now-auth', 'hapi-auth-bearer-token', 'hapi-swagger', 'blipp', './api/auth', './api', './domain/directory', 'good']
      plugins.forEach(p => {
        test.ok(findPluginByPath(Manifest.register.plugins, p))
      })
      test.end()
    })

    registrationsTest.test('register and configure good plugin', test => {
      let found = findPluginByRegisterName(Manifest.register.plugins, 'good')

      test.ok(found)
      test.equal(found.options.reporters.console.length, 3)
      test.equal(found.options.reporters.console[0].module, 'good-squeeze')
      test.equal(found.options.reporters.console[1].module, 'good-console')
      test.equal(found.options.reporters.console[2], 'stdout')
      test.end()
    })

    registrationsTest.test('register and configure hapi-swagger plugin', test => {
      let found = findPluginByRegisterName(Manifest.register.plugins, 'hapi-swagger')

      test.ok(found)
      test.equal(found.options.info.title, 'Central Directory API Documentation')
      test.equal(found.options.info.version, Pack.version)
      test.end()
    })

    registrationsTest.end()
  })

  manifestTest.end()
})

function findPluginByPath (plugins, path) {
  return plugins.find(function (p) {
    return p.plugin && (typeof p.plugin === 'string') && p.plugin === path
  })
}

function findPluginByRegisterName (plugins, registerName) {
  return plugins.find(function (p) {
    return p && (typeof p === 'object') && p.plugin && p.plugin === registerName
  })
}
