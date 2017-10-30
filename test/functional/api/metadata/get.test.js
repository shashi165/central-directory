'use strict'

const Test = require('tape')
const Base = require('../base')

Test('return metadata', test => {
  Base.get('/')
    .expect(200)
    .expect('Content-Type', /json/)
    .then(res => {
      test.equal(Object.keys(res.body.urls).length, 5)
      test.equal(res.body.urls.health, `http://${Base.hostname}/health`)
      test.equal(res.body.urls.identifier_types, `http://${Base.hostname}/identifier-types`)
      test.equal(res.body.urls.resources, `http://${Base.hostname}/resources`)
      test.equal(res.body.urls.register_identifier, `http://${Base.hostname}/resources`)
      test.equal(res.body.urls.auth_token, `http://${Base.hostname}/auth_token`)
      test.end()
    })
})
