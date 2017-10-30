'use strict'

exports.up = function(knex, Promise) {
  return knex.schema.table('tokens', (t) => {
    t.index('dfspId')
    t.unique('token')
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.table('tokens', (t) => {
    t.dropIndex('dfspId')
    t.dropUnique('token')
  })
}
