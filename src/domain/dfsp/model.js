'use strict'

const Db = require('../../db')

exports.getByName = (name) => {
  return Db.dfsps.findOne({ name })
}

exports.getByDfspSchemeIdentifier = (dfspSchemeIdentifier) => {
  return Db.dfsps.findOne({ dfspSchemeIdentifier })
}

exports.create = ({ name, shortName, key, secretHash, dfspSchemeIdentifier, url }) => {
  return Db.dfsps.insert({
    name,
    shortName,
    key,
    secretHash,
    dfspSchemeIdentifier,
    url
  })
}
