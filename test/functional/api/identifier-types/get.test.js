'use strict'

const Test = require('tape')
const Base = require('../base')

Test('get /identifier-types', getTest => {
  getTest.test('authentication', authTest => {
    authTest.test('return UnauthorizedError', test => {
      Base.get('/identifier-types')
        .expect(401)
        .expect('WWW-Authenticate', 'Basic error="Missing authorization"')
        .expect('Content-Type', /json/)
        .then(res => {
          test.equal(res.body.id, 'UnauthorizedError')
          test.equal(res.body.message, 'Missing authorization')
          test.end()
        })
    })

    authTest.test('not basic should return InvalidAuthorizationError', test => {
      Base.get('/identifier-types', { 'Authorization': 'notbasic ' })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(res => {
          test.equal(res.body.id, 'InvalidAuthorizationError')
          test.equal(res.body.message, 'Bad HTTP authorization header')
          test.end()
        })
    })

    authTest.test('missing username should return UnauthorizedError', test => {
      Base.get('/identifier-types', Base.basicAuth('', 'password'))
        .expect(401)
        .expect('Content-Type', /json/)
        .expect('WWW-Authenticate', 'Basic error="Missing username"')
        .then(res => {
          test.equal(res.body.id, 'UnauthorizedError')
          test.equal(res.body.message, 'Missing username')
          test.end()
        })
    })
  })

  getTest.test('authorized', authorizedTest => {
    authorizedTest.test('returns registered identifier-types', test => {
      Base.authenticateDfsp()
        .then(authHeader => {
          Base.get('/identifier-types', authHeader)
            .expect(200)
            .expect('Content-Type', /json/)
            .then(res => {
              test.equal(2, res.body.length)
              test.deepEqual(res.body, [{ identifierType: 'eur', description: 'End User Registry number' }, { identifierType: 'tel', description: 'E.164 phone number' }])
              test.end()
            })
        })
    })
    authorizedTest.end()
  })

  getTest.end()
})
