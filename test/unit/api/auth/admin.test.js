'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Config = require('../../../../src/lib/config')
const AdminAuth = require('../../../../src/api/auth/admin')
// const Logger = require('@mojaloop/central-services-shared').Logger

const request = {}
const h = {}

Test('admin auth', authTest => {
  let sandbox
  let adminKey = 'adminTest'
  let adminSecret = 'adminTest'
  let oldAdminKey
  let oldAdminSecret

  authTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()

    oldAdminKey = Config.ADMIN_KEY
    oldAdminSecret = Config.ADMIN_SECRET

    Config.ADMIN_KEY = adminKey
    Config.ADMIN_SECRET = adminSecret

    t.end()
  })

  authTest.afterEach(t => {
    sandbox.restore()

    Config.ADMIN_KEY = oldAdminKey
    Config.ADMIN_SECRET = oldAdminSecret

    t.end()
  })

  authTest.test('name should', nameTest => {
    nameTest.test('be "simple"', test => {
      test.equal(AdminAuth.name, 'simple')
      test.end()
    })
    nameTest.end()
  })

  authTest.test('scheme should', schemeTest => {
    schemeTest.test('be "basic"', test => {
      test.equal(AdminAuth.scheme, 'basic')
      test.end()
    })
    schemeTest.end()
  })

  authTest.test('validate should', validateTest => {
    validateTest.test('return invalid if username is not configured admin key', async test => {
      const response = await AdminAuth.validate(request, '!adminKey', adminSecret, h)
      test.equal(response.isValid, false)
      test.end()
    })

    validateTest.test('return invalid if password is not configured admin secret', async test => {
      const response = await AdminAuth.validate(request, adminKey, '!adminSecret', h)
      test.equal(response.isValid, false)
      test.end()
    })

    validateTest.test('return valid if username and password are configured values', async test => {
      const response = await AdminAuth.validate(request, adminKey, adminSecret, h)
      test.equal(response.isValid, true)
      test.equal(response.credentials.name, 'admin')
      test.end()
    })

    validateTest.end()
  })

  authTest.end()
})
