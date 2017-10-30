'use strict'

const Test = require('tape')
const Base = require('../base')

Test('return health', test => {
  Base.get('/health')
    .expect(200)
    .expect('Content-Type', /json/)
    .then(res => {
      test.equal(res.body.status, 'OK')
      test.end()
    })
})
