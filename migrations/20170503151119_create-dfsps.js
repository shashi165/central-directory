'use strict'

exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('dfsps', (t) => {
    t.increments('dfspId').primary()
    t.string('name', 256).notNullable()
    t.string('key', 256).notNullable()
    t.string('secretHash', 1024).notNullable()
    t.string('url', 1024).notNullable()
    t.string('dfspSchemeIdentifier', 10).notNullable()
    t.timestamp('createdDate').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('dfsps')
}
