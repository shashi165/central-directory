'use strict'

exports.up = function(knex, Promise) {
  return knex.schema.table('dfsps', (t) => {
    t.index('dfspSchemeIdentifier')
    t.unique('dfspSchemeIdentifier')
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.table('dfsps', (t) => {
    t.dropIndex('dfspSchemeIdentifier')
    t.dropUnique('dfspSchemeIdentifier')
  })
}
