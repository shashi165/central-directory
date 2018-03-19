'use strict'

const Registry = require('../../domain/directory/registry')

exports.identifierTypes = async function (request, h) {
  const result = await Registry.identifierTypes()
  result.map(t => ({
    identifierType: t.identifierType,
    description: t.description
  }))
  return result
}
