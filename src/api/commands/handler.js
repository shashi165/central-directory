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

exports.create = async function (request, h) {
  try {
    const dfsp = await DfspService.create(request.payload.name, request.payload.shortName, request.payload.providerUrl)
    return h.response(buildResponse(dfsp)).code(201)
  } catch (e) {
    throw e
  }
}
