'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Glue = require('glue')
const P = require('bluebird')
const Db = require('../../src/db')
const Manifest = require('../../src/manifest')
const Logger = require('@mojaloop/central-services-shared').Logger
const Migrator = require('../../src/lib/migrator')
const Config = require('../../src/lib/config')

Test('server test', serverTest => {
  let sandbox
  let oldDatabaseUri
  let databaseUri = 'some-database-uri'

  serverTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Glue, 'compose')
    sandbox.stub(Db, 'connect')
    sandbox.stub(Logger, 'info')
    sandbox.stub(Logger, 'error')
    sandbox.stub(Migrator, 'migrate')

    oldDatabaseUri = Config.DATABASE_URI
    Config.DATABASE_URI = databaseUri

    t.end()
  })

  serverTest.afterEach(t => {
    delete require.cache[require.resolve('../../src/server')]
    sandbox.restore()
    Config.DATABASE_URI = oldDatabaseUri
    t.end()
  })

  serverTest.test('setup should', setupTest => {
    setupTest.test('run all actions', test => {
      let serverUri = 'http://localhost'
      let serverStub = sandbox.stub()
      serverStub.returns(P.resolve({}))
      let server = {
        start: serverStub,
        info: {
          uri: serverUri
        }
      }

      Glue.compose.returns(Promise.resolve(server))
      Db.connect.returns(P.resolve({}))
      Migrator.migrate.returns(P.resolve({}))

      require('../../src/server')
      .then(() => {
        test.ok(Migrator.migrate.calledOnce)
        test.ok(Migrator.migrate.calledBefore(Db.connect))
        test.ok(Db.connect.calledOnce)
        test.ok(Db.connect.calledWith(databaseUri))
        test.ok(Db.connect.calledBefore(Glue.compose))
        test.ok(Glue.compose.calledWith(Manifest))
        test.ok(Glue.compose.calledBefore(serverStub))
        test.ok(serverStub.calledOnce)
        test.ok(Logger.info.calledWith(`Server running at: ${serverUri}`))
        test.end()
      })
    })

    setupTest.test('Log error on start', test => {
      let error = new Error()
      Migrator.migrate.returns(P.reject(error))

      require('../../src/server')
      .then(() => {
        test.fail('Expected exception to be thrown')
        test.end()
      })
      .catch(e => {
        test.equal(e, error)
        test.ok(Logger.error.calledWith(e))
        test.end()
      })
    })
    setupTest.end()
  })

  serverTest.end()
})
