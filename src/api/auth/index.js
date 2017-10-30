'use strict'

const DfspStrategy = require('./dfsp')
const AdminStrategy = require('./admin')
const TokenStrategy = require('./token')
const Config = require('../../lib/config')

exports.register = (server, options, next) => {
  server.auth.strategy(AdminStrategy.name, AdminStrategy.scheme, { validate: AdminStrategy.validate })
  server.auth.strategy(DfspStrategy.name, DfspStrategy.scheme, { validate: DfspStrategy.validate })
  server.auth.strategy(TokenStrategy.name, TokenStrategy.scheme, { validate: TokenStrategy.validate })
  next()
}

exports.register.attributes = {
  name: 'auth-strategies'
}

exports.strategy = () => {
  const strategy = (Config.ENABLE_TOKEN_AUTH ? TokenStrategy.name : DfspStrategy.name)
  return {
    mode: 'required',
    strategy
  }
}
