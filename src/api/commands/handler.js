'use strict'

const DfspService = require('../../domain/dfsp')

const buildResponse = (dfsp) => {
  return {
    name: dfsp.name,
    shortName: dfsp.shortName,
    providerUrl: dfsp.url,
    key: dfsp.name,
    secret: dfsp.name
  }
}

exports.create = (request, reply) => {
  DfspService.create(request.payload.name, request.payload.shortName, request.payload.providerUrl)
    .then(dfsp => reply(buildResponse(dfsp)).code(201))
    .catch(e => reply(e))
}
