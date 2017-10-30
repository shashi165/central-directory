'use strict'

module.exports = {
  identifierType: 'test',
  description: 'test',
  find: (id, callback) => {
    if (id < 0) return callback(new Error())
    if (id > 10) return callback(null, null)
    return callback(null, `http://example.directory/users/${id}`)
  }
}
