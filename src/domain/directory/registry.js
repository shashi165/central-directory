'use strict'

const P = require('bluebird')
const InvalidDirectoryError = require('../../errors/invalid-directory-error')
const TypeCheck = require('../../lib/type-check')

const directories = {}
const identifierTypes = []

const resolveDirectory = (config) => {
  return P.resolve(TypeCheck.isFunction(config) ? config() : config)
    .then(({identifierType, description, find, registerIdentifier, format}) => {
      if (!identifierType) {
        throw new InvalidDirectoryError('Directory does not implement required property \'identifierType\'')
      }
      if (!TypeCheck.isString(identifierType)) {
        throw new InvalidDirectoryError('\'identifierType\' must be a string')
      }
      if (!description) {
        throw new InvalidDirectoryError('Directory does not implement required property \'description\'')
      }
      if (!TypeCheck.isString(description)) {
        throw new InvalidDirectoryError('\'description\' must be a string')
      }
      if (!find) {
        throw new InvalidDirectoryError('Directory does not implement required function \'find\'')
      }
      if (!TypeCheck.isFunction(find)) {
        throw new InvalidDirectoryError('\'find\' must be a function')
      }
      if (format && !(TypeCheck.isFunction(format) || TypeCheck.isRegex(format))) {
        throw new InvalidDirectoryError('\'format\' must be a regular expression or function')
      }

      return {
        identifierType,
        description,
        find,
        registerIdentifier,
        format
      }
    })
}

const resolveFormat = (format) => {
  if (!format) {
    return () => true
  }
  if (TypeCheck.isRegex(format)) {
    return (value) => format.test(value)
  }
  return format
}

const addDirectory = ({ identifierType, description, find, registerIdentifier, format }) => {
  if (directories[identifierType]) {
    throw new InvalidDirectoryError(`Directory with 'identifierType' = '${identifierType}' has already been registered`)
  }
  const directory = {
    identifierType,
    description,
    find,
    registerIdentifier,
    isIdentifierValid: resolveFormat(format)
  }
  directories[identifierType] = directory
  identifierTypes.push({ identifierType, description })
  return directory
}

exports.register = (...configs) => {
  return P.all(configs.map(resolveDirectory))
    .then(directories => directories.map(addDirectory))
}

exports.byIdentifierType = (identifierType) => {
  return P.resolve(directories[identifierType])
}

exports.identifierTypes = () => P.resolve(identifierTypes)
