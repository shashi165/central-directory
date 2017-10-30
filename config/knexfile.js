'use strict'

const Config = require('../src/lib/config')

const migrationsDirectory = '../migrations'

module.exports = {
  client: 'pg',
  connection: Config.DATABASE_URI,
  migrations: {
    directory: migrationsDirectory,
    tableName: 'migrations',
    stub: `${migrationsDirectory}/migration.template`
  }
}
