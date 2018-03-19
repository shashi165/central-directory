'use strict'

const Handler = require('./handler')
const DfspAuthStrategy = require('../auth/dfsp')

const tags = ['api', 'token']

module.exports = [
  {
    method: 'GET',
    path: '/auth_token',
    handler: Handler.create,
    options: {
      tags,
      auth: DfspAuthStrategy.name,
      description: 'Get a token that can be used to authenticate future requests',
      id: 'auth_token'
    }
  }
]
