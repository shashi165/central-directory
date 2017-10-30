'use strict'

const Test = require('tape')
const Base = require('../base')

Test('get resources', getTest => {
  getTest.test('authorization', authTest => {
    authTest.test('with no authorization should return Unauthorized', test => {
      Base.get('/resources')
        .expect(401)
        .expect('Content-Type', /json/)
        .expect('WWW-Authenticate', 'Basic error="Missing authorization"')
        .then(res => {
          test.equal(res.body.id, 'UnauthorizedError')
          test.equal(res.body.message, 'Missing authorization')
          test.end()
        })
    })

    authTest.test('non-existing dfsp should return Unauthorized', test => {
      Base.get('/resources', Base.basicAuth('test', 'test'))
        .expect('Content-Type', /json/)
        .expect('WWW-Authenticate', 'Basic error="Bad username or password"')
        .then(res => {
          test.equal(res.body.id, 'UnauthorizedError')
          test.equal(res.body.message, 'Bad username or password')
          test.end()
        })
    })

    authTest.end()
  })

  getTest.test('with empty query should', emptyTypeTest => {
    emptyTypeTest.test('return InvalidQueryParameterError', test => {
      Base.authenticateDfsp()
        .then(authHeader => {
          Base.get('/resources', authHeader)
            .expect(400)
            .then(res => {
              test.equal(res.body.id, 'InvalidQueryParameterError')
              test.equal(res.body.message, 'Error validating one or more query parameters')
              test.equal(res.body.validationErrors[0].message, 'identifier is required')
              test.end()
            })
        })
    })

    emptyTypeTest.end()
  })

  getTest.test('with no dfsp assigned and no default dfsp set should', defaultDfspTest => {
    defaultDfspTest.test('throw internal error', test => {
      let name = 'dfspZ'
      Base.authenticateDfsp(name)
        .then(authHeader => {
          Base.get('/resources?identifier=eur:2', authHeader)
            .expect(500)
            .then(res => {
              test.equal(res.body.id, 'InternalError')
              test.equal(res.body.message, 'Error retrieving DFSP.')
              test.end()
            })
        })
    })

    defaultDfspTest.end()
  })

  getTest.test('with no dfsp assigned and default dfsp set should', defaultDfspTest => {
    defaultDfspTest.test('return default dfsp', test => {
      let name = 'dfspA'
      let shortName = 'dA'
      Base.authenticateDfsp(name, shortName)
        .then(authHeader => {
          Base.get('/resources?identifier=eur:2', authHeader)
            .expect(200)
            .then(res => {
              let defaultDfsp = res.body[0]
              test.equal(defaultDfsp.name, name)
              test.equal(defaultDfsp.shortName, shortName)
              test.ok(defaultDfsp.providerUrl)
              test.equal(defaultDfsp.registered, false)
              test.equal(defaultDfsp.primary, true)
              test.end()
            })
        })
    })

    defaultDfspTest.end()
  })

  getTest.end()
})
