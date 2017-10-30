'use strict'

const Config = require('./lib/config')
const Pack = require('../package')

module.exports = {
  connections: [
    {
      port: Config.PORT,
      routes: {
        validate: require('@mojaloop/central-services-error-handling').validateRoutes()
      }
    }
  ],
  registrations: [
    { plugin: 'inert' },
    { plugin: 'vision' },
    {
      plugin: {
        register: 'hapi-swagger',
        options: {
          info: {
            'title': 'Central Directory API Documentation',
            'version': Pack.version
          }
        }
      }
    },
    { plugin: 'blipp' },
    { plugin: '@mojaloop/central-services-error-handling' },
    { plugin: '@mojaloop/central-services-auth' },
    { plugin: './api/auth' },
    { plugin: './api' },
    { plugin: './domain/directory' },
    {
      plugin: {
        register: 'good',
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
    }
  ]
}
