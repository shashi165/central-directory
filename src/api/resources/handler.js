'use strict'

const P = require('bluebird')
const NotFoundError = require('@mojaloop/central-services-shared').NotFoundError
const Validator = require('./validator')
const Config = require('../../lib/config')
const DfspService = require('../../domain/dfsp')

const parseIdentifier = (queryIdentifier) => {
  let identifier = ''
  let identifierType = ''

  if (queryIdentifier !== undefined && queryIdentifier.includes(':')) {
    const splitQueryIdentifier = queryIdentifier.split(':')
    identifierType = splitQueryIdentifier[0]
    identifier = splitQueryIdentifier[1]
  }

  return { identifier, identifierType }
}

const performValidation = (identifier) => {
  const parsed = parseIdentifier(identifier)
  return Validator.get(parsed)
}

const dfspResponse = ({ dfsp, primary = false, registered = true }) => {
  return {
    name: dfsp.name,
    providerUrl: dfsp.url,
    shortName: dfsp.shortName,
    primary,
    registered
  }
}

const retrieveDefaultDfsp = () => {
  return DfspService.getDefaultDfsp().then(d => [dfspResponse({ dfsp: d, primary: true, registered: false })])
}

exports.get = (request, reply) => {
  performValidation(request.query.identifier)
    .then(({ directory, identifier, identifierType }) => {
      return new P((resolve, reject) => {
        directory.find(identifier, (err, result) => {
          if (err) {
            return (err instanceof NotFoundError) ? resolve(retrieveDefaultDfsp()) : reject(err)
          } else {
            let invalidSchemeId = result.find(f => f.schemeIdentifier !== Config.SCHEME_ID)
            if (invalidSchemeId) {
              return reject(new NotFoundError('Cross-scheme lookups are not currently supported'))
            }

            return P.all(result.map(r => DfspService.getByDfspSchemeIdentifier(r.dfspSchemeIdentifier)
              .then(dfsp => {
                return { dfsp, primary: r.primary }
              }
            )))
            .then(dfsps => {
              // Get rid of any DFSPs that can't be found but have a matching SCHEME_ID. This could be due to deleted records. or by sharing test data.
              let filteredDfsps = dfsps.filter(d => d.dfsp !== null)
              resolve(filteredDfsps.map(d => dfspResponse(d)))
            })
          }
        })
      })
    })
    .then(reply)
    .catch(reply)
}

exports.registerIdentifier = (request, reply) => {
  const credentials = request.auth.credentials
  performValidation(request.payload.identifier)
    .then(({ directory, identifier, identiferType }) => {
      return new P((resolve, reject) => {
        directory.registerIdentifier({ identifier, dfspSchemeIdentifier: credentials.dfspSchemeIdentifier, primary: request.payload.primary }, (err, result) => {
          if (err) {
            return reject(err)
          } else {
            if (!result) {
              return reject(new Error('The identifier could not be registered'))
            }
            return DfspService
              .getByDfspSchemeIdentifier(result.dfspSchemeIdentifier)
              .then(dfsp => resolve(dfspResponse({ dfsp, primary: result.primary })))
          }
        })
      })
    })
    .then(reply)
    .catch(reply)
}
