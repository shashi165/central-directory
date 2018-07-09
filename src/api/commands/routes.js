'use strict'

const Joi = require('joi')
const Handler = require('./handler')
const AdminAuthStrategy = require('../auth/admin')

const tags = ['api', 'commands']

module.exports = [
  {
    method: 'POST',
    path: '/commands/register',
    handler: Handler.create,
    options: {
      tags: tags,
      auth: AdminAuthStrategy.name,
      validate: {
        payload: {
          name: Joi.string().max(256).required().description('DFSP name'),
          shortName: Joi.string().token().max(10).required().description('Short name for the DFSP'),
          providerUrl: Joi.string().uri().max(1024).required().description('DFSP url')
        }
      }
    }
  }
]
