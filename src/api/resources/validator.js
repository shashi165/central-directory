'use strict'

const InvalidQueryParameterError = require('@mojaloop/central-services-error-handling').InvalidQueryParameterError
const Registry = require('../../domain/directory/registry')

exports.get = ({ identifierType, identifier }) => {
  return Registry.byIdentifierType(identifierType)
    .then(directory => {
      if (!directory) {
        throw new InvalidQueryParameterError({
          message: `'${identifierType}' is not a registered identifierType`, // eslint-disable-line
          params: {
            key: 'identifierType',
            value: identifierType
          }
        })
      }
      if (!directory.isIdentifierValid(identifier)) {
        throw new InvalidQueryParameterError({
          message: `'${identifier}' is not a valid identifier for identifierType '${identifierType}'`, // eslint-disable-line
          params: {
            key: 'identifier',
            value: identifier
          }
        })
      }
      return {
        directory,
        identifier,
        identifierType
      }
    })
}
