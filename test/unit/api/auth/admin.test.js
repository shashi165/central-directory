'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const Config = require('../../../../src/lib/config')
const AdminAuth = require('../../../../src/api/auth/admin')

const request = {}

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
    nameTest.test('be "admin"', test => {
      test.equal(AdminAuth.name, 'admin')
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
    validateTest.test('return invalid if username is not configured admin key', test => {
      let callback = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      AdminAuth.validate(request, 'notadmin', adminSecret, callback)
    })

    validateTest.test('return invalid if password is not configured admin secret', test => {
      let callback = (err, isValid) => {
        test.notOk(err)
        test.equal(isValid, false)
        test.end()
      }

      AdminAuth.validate(request, adminKey, 'password', callback)
    })

    validateTest.test('return valid if username and password are configured values', test => {
      let callback = (err, isValid, credentials) => {
        test.notOk(err)
        test.equal(isValid, true)
        test.equal(credentials.name, 'admin')
        test.end()
      }

      AdminAuth.validate(request, adminKey, adminSecret, callback)
    })

    validateTest.end()
  })

  authTest.end()
})
