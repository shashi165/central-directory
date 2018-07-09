'use strict'

const Glue = require('glue')
const Manifest = require('./manifest')
const Db = require('./db')
const Logger = require('@mojaloop/central-services-shared').Logger
const Migrator = require('./lib/migrator')
const Config = require('./lib/config')

const composeOptions = { relativeTo: __dirname }

module.exports = Migrator.migrate()
  .then(() => Db.connect(Config.DATABASE_URI))
  .then(() => Glue.compose(Manifest, composeOptions))
  .then(server => server.start().then(() => Logger.info(`Server running at: ${server.info.uri}`)))
  .catch(err => {
    Logger.error(err)
    throw err
  })
