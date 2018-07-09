'use strict'

const Joi = require('joi')
const Handler = require('./handler')
const Auth = require('../auth')

const tags = ['api', 'metadata']
const validIdentifierRegExs = [Joi.string().regex(/^eur:[0-9]{1,8}$/, 'End User Registry number'), Joi.string().regex(/^tel:\+?[1-9]\d{1,14}$/, 'E.164 telephone number')]

module.exports = [{
  method: 'GET',
  path: '/resources',
  handler: Handler.get,
  options: {
    tags: tags,
    description: 'Look up user',
    id: 'resources',
    auth: Auth.strategy(),
    validate: {
      query: Joi.object().keys({
        'identifier': Joi.alternatives().try(validIdentifierRegExs).required().description('Identifier and identifier type concatenated by a colon')
      })
    }
  }
},
{
  method: 'POST',
  path: '/resources',
  handler: Handler.registerIdentifier,
  options: {
    tags: tags,
    description: 'Register identifier',
    id: 'register_identifier',
    auth: Auth.strategy(),
    validate: {
      payload: Joi.object().keys({
        'identifier': Joi.alternatives().try(validIdentifierRegExs).required().description('Identifier and identifier type concatenated by a colon'),
        'primary': Joi.bool().description('Details if the DFSP is to be set as primary')
      })
    }
  }
}]
