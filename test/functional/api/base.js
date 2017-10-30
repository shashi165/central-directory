'use strict'

const Uuid = require('uuid4')
const Encoding = require('@mojaloop/central-services-shared').Encoding
let host = process.env.HOST_IP || 'localhost'
const Request = require('supertest-as-promised')('http://' + host + ':3000')

const post = (path, data, headers = {}) => {
  return Request.post(path).set(headers).send(data)
}

const get = (path, headers = {}) => {
  return Request.get(path).set(headers)
}

const registerDfsp = (name, shortName = 'short') => {
  return post('/commands/register', { name: name, shortName: shortName, providerUrl: 'http://the_url' }, basicAuth('admin', 'admin'))
    .then(res => ({ name: res.body.name, shortName: res.body.shortName, key: res.body.key, secret: res.body.secret }))
}

const basicAuth = (name, password) => {
  let credentials = Encoding.toBase64(name + ':' + password)
  return { 'Authorization': `Basic ${credentials}` }
}

const authenticateDfsp = (name = `dfsp${Uuid().replace(/-/g, '')}`, shortName = 'short') => {
  return registerDfsp(name, shortName)
    .then(dfsp => basicAuth(dfsp.key, dfsp.secret))
}

module.exports = {
  post,
  get,
  authenticateDfsp,
  registerDfsp,
  basicAuth,
  hostname: 'central-directory'
}
