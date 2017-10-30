'use strict'

const Test = require('tape')
const Base = require('../base')

Test('return api documentation', test => {
  Base.get('/documentation')
    .expect(200)
    .expect('Content-Type', /html/)
    .then(res => {
      test.end()
    })
})
