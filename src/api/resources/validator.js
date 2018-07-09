'use strict'

const InvalidQueryParameterError = require('@mojaloop/central-services-error-handling').InvalidQueryParameterError
const Registry = require('../../domain/directory/registry')

exports.get = async ({ identifierType, identifier }) => {
  const directory = await Registry.byIdentifierType(identifierType)
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
}
