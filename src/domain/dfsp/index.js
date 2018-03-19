'use strict'

const P = require('bluebird')
const Model = require('./model')
const Crypto = require('../../lib/crypto')
const AlreadyExistsError = require('../../errors/already-exists-error')
const InternalError = require('../../errors/internal-error')
const Config = require('../../lib/config')

const create = (name, shortName, url, attempt = 1) => {
  return Model.getByName(name)
    .then(dfsp => {
      if (dfsp) {
        throw new AlreadyExistsError('Duplicate DFSP definition')
      } else {
        return null
      }
    })
    .then(() => Crypto.hash(name))
    .then(hash => {
      return Model.create({
        name: name,
        shortName: shortName,
        key: name,
        secretHash: hash,
        dfspSchemeIdentifier: calculateDfspSchemeIdentifier(),
        url: url
      })
    })
    .catch(e => {
      if (e.name === 'AlreadyExistsError') {
        throw new AlreadyExistsError('Duplicate DFSP definition')
      }
      if (attempt >= 5) {
        throw Error('Error generating DFSP scheme identifier')
      } else {
        return create(name, shortName, url, attempt + 1)
      }
    })
}

const getByName = (name) => {
  return Model.getByName(name)
}

const getByDfspSchemeIdentifier = (dfspSchemeIdentifier) => {
  return Model.getByDfspSchemeIdentifier(dfspSchemeIdentifier)
}

const getDefaultDfsp = () => {
  const defaultDfsp = Config.DEFAULT_DFSP
  return new P((resolve, reject) => {
    if (defaultDfsp) {
      return Model.getByName(defaultDfsp).then(dfsp => {
        const response = dfsp ? resolve(dfsp) : reject(new InternalError('Error retrieving DFSP.'))
        return response
      })
    } else {
      reject(new InternalError('Error retrieving DFSP.'))
      // return
    }
  })
}

const calculateDfspSchemeIdentifier = () => {
  const dfspSchemeIdentifier = Math.floor(Math.random() * 999 + 1).toString()
  return padLeftWithZeroes(dfspSchemeIdentifier, 3)
}

const padLeftWithZeroes = (num, len) => {
  return (Array(len).join('0') + num).slice(-len)
}

module.exports = {
  create,
  getByName,
  getByDfspSchemeIdentifier,
  getDefaultDfsp
}
