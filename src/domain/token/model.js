'use strict'

const Moment = require('moment')
const Db = require('../../db')

const create = ({ dfspId, token, expiration }) => {
  return Db.tokens.insert({
    dfspId,
    token,
    expiration
  })
}

const byDfsp = ({ dfspId }) => {
  return Db.tokens.find({ dfspId })
}

const removeExpired = () => {
  return Db.tokens.destroy({ 'expiration <=': Moment.utc().toISOString() })
}

module.exports = {
  create,
  byDfsp,
  removeExpired
}
