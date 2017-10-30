'use strict'

exports.up = function (knex, Promise) {
  return knex.schema.table('dfsps', (t) => {
    t.string('shortName', 10)
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.table('dfsps', (t) => {
    t.dropColumn('shortName')
  })
}
