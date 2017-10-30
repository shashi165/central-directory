'use strict'

exports.up = function(knex, Promise) {
  return knex.schema.createTableIfNotExists('tokens', (t) => {
    t.increments('tokenId').primary()
    t.integer('dfspId').nullable()
    t.foreign('dfspId').references('dfsps.dfspId')
    t.string('token', 1000).notNullable()
    t.bigInteger('expiration').nullable()
    t.timestamp('createdDate').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('tokens')
}
