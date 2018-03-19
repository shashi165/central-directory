'use strict'

const Config = require('./lib/config')
const Pack = require('../package')
const ErrorHandling = require('@mojaloop/central-services-error-handling')
const Boom = require('boom')

module.exports = {
  server: {
    port: Config.PORT,
    routes: {
      validate: {
        options: ErrorHandling.validateRoutes(),
        failAction: async function (request, h, err) {
          throw Boom.boomify(err)
        }
      }
    }
  },
  register: {
    plugins: [
      { plugin: 'inert' },
      { plugin: 'vision' },
      { plugin: '@mojaloop/central-services-error-handling' },
      { plugin: 'hapi-auth-basic' },
      { plugin: '@now-ims/hapi-now-auth' },
      { plugin: 'hapi-auth-bearer-token' },
      {
        plugin: 'hapi-swagger',
        options: {
          info: {
            'title': 'Central Directory API Documentation',
            'version': Pack.version
          }
        }
      },
      { plugin: 'blipp' },
      { plugin: './api/auth' },
      { plugin: './api' },
      { plugin: './domain/directory' },
      {
        plugin: 'good',
        options: {
          ops: {
            interval: 1000
          },
          reporters: {
            console: [
              {
                module: 'good-squeeze',
                name: 'Squeeze',
                args: [
                  {
                    response: '*',
                    log: '*',
                    error: '*'
                  }
                ]
              },
              {
                module: 'good-console',
                args: [
                  {
                    format: 'YYYY-MM-DD HH:mm:ss.SSS'
                  }
                ]
              },
              'stdout'
            ]
          }
        }
      }
    ]
  }
}
