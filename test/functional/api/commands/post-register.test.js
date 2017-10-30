'use strict'

const Test = require('tapes')(require('tape'))
const Base = require('../base')
const RegisterPath = '/commands/register'

const hostname = 'http://some-host.com'

let register = (data = {}, statusCode = 201) => {
  return Base.post(RegisterPath, data, Base.basicAuth('admin', 'admin'))
    .expect(statusCode)
    .expect('Content-Type', /json/)
}

Test('register dfsp', registerTest => {
  registerTest.test('with no authorization should', noAuthTest => {
    noAuthTest.test('return UnauthorizedError', test => {
      const providerUrl = `${hostname}/accounts/dfsp1`
      Base.post(RegisterPath, { name: 'name', shortName: 'short', providerUrl: providerUrl })
        .expect(401)
        .expect('Content-Type', /json/)
        .expect('WWW-Authenticate', 'Basic error="Missing authorization"')
        .then(res => {
          test.equal(res.body.id, 'UnauthorizedError')
          test.equal(res.body.message, 'Missing authorization')
          test.end()
        })
    })

    noAuthTest.end()
  })

  registerTest.test('create dfsp', test => {
    let name = 'The First DFSP'
    let shortName = 'dfsp1'
    let providerUrl = `${hostname}/accounts/dfsp1`
    register({ name, shortName, providerUrl })
      .then(res => {
        test.equal(res.body.name, name)
        test.equal(res.body.shortName, shortName)
        test.equal(res.body.key, name)
        test.equal(res.body.secret, name)
        test.equal(res.body.providerUrl, providerUrl)
        test.end()
      })
  })

  registerTest.test('return AlreadExistsError if duplicate dfsp name', test => {
    let name = 'The Second DFSP'
    let shortName = 'dfsp2'
    let providerUrl = `${hostname}/accounts/dfsp2`
    register({ name, shortName, providerUrl: providerUrl })
      .then(() => {
        register({ name, shortName, providerUrl: providerUrl }, 422)
          .then(res => {
            test.equal(res.body.id, 'AlreadyExistsError')
            test.equal(res.body.message, 'Duplicate DFSP definition')
            test.end()
          })
      })
  })

  registerTest.test('return validation error if body does not contain name', test => {
    let shortName = 'dfsp1'
    let providerUrl = `${hostname}/accounts/dfsp1`
    register({ shortName, providerUrl: providerUrl }, 400)
      .then(res => {
        test.equal(res.body.id, 'InvalidBodyError')
        test.equal(res.body.message, 'Body does not match schema')
        test.deepEqual(res.body.validationErrors, [{ message: 'name is required', params: { key: 'name' } }])
        test.end()
      })
  })

  registerTest.test('return validation error if body does not contain shortName', test => {
    let name = 'dfsp1'
    let providerUrl = `${hostname}/accounts/dfsp1`
    register({ name, providerUrl: providerUrl }, 400)
      .then(res => {
        test.equal(res.body.id, 'InvalidBodyError')
        test.equal(res.body.message, 'Body does not match schema')
        test.deepEqual(res.body.validationErrors, [{ message: 'shortName is required', params: { key: 'shortName' } }])
        test.end()
      })
  })

  registerTest.test('return validation error if body does not contain url', test => {
    register({ name: 'name', shortName: 'short' }, 400)
      .then(res => {
        test.equal(res.body.id, 'InvalidBodyError')
        test.equal(res.body.message, 'Body does not match schema')
        test.deepEqual(res.body.validationErrors, [{ message: 'providerUrl is required', params: { key: 'providerUrl' } }])
        test.end()
      })
  })

  registerTest.test('return validation error if shortName is not a token', test => {
    let shortName = '&*#&#('
    let providerUrl = `${hostname}/accounts/dfsp1`
    register({ name: 'name', shortName: shortName, providerUrl: providerUrl }, 400)
      .then(res => {
        test.equal(res.body.id, 'InvalidBodyError')
        test.equal(res.body.message, 'Body does not match schema')
        test.deepEqual(res.body.validationErrors, [{ message: 'shortName must only contain alpha-numeric and underscore characters', params: { key: 'shortName', value: shortName } }])
        test.end()
      })
  })

  registerTest.test('return validation error if url is not a url', test => {
    let providerUrl = '&*#&#(&#())'
    register({ name: 'name', shortName: 'short', providerUrl: providerUrl }, 400)
      .then(res => {
        test.equal(res.body.id, 'InvalidBodyError')
        test.equal(res.body.message, 'Body does not match schema')
        test.deepEqual(res.body.validationErrors, [{ message: 'providerUrl must be a valid uri', params: { key: 'providerUrl', value: providerUrl } }])
        test.end()
      })
  })
  registerTest.end()
})
