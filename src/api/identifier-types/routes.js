'use strict'

const Handler = require('./handler')
const Auth = require('../auth')

const tags = ['api', 'identifier-types']

module.exports = [
  {
    method: 'GET',
    path: '/identifier-types',
    handler: Handler.identifierTypes,
    options: {
      tags: tags,
      auth: Auth.strategy(),
      description: 'Available identifier types',
      id: 'identifier_types'
    }
  }
]
