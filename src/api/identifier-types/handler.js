'use strict'

const Registry = require('../../domain/directory/registry')

exports.identifierTypes = (request, reply) => {
  Registry.identifierTypes()
    .then(result => result.map(t => ({
      identifierType: t.identifierType,
      description: t.description
    })))
    .then(result => reply(result))
    .catch(e => reply(e))
}
