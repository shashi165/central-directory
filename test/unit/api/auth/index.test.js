'use strict'

const src = '../../../../src'
const Test = require('tape')
const Sinon = require('sinon')
const Config = require(`${src}/lib/config`)
const AuthModule = require(`${src}/api/auth`)
const DfspStrategy = require(`${src}/api/auth/dfsp`)
const TokenStrategy = require(`${src}/api/auth/token`)

Test('Auth Module', moduleTest => {
  moduleTest.test('register should', registerTest => {
    registerTest.test('register dfsp auth strategy', test => {
      let strategySpy = Sinon.spy()
      let server = {
        auth: {
          scheme: Sinon.spy(),
          strategy: strategySpy
        }
      }

      let next = () => {
        test.ok(strategySpy.calledWith(DfspStrategy.name, 'basic', Sinon.match({ validate: DfspStrategy.validate })))
        test.end()
      }

      AuthModule.register(server, null, next)
    })

    registerTest.test('register token auth strategy', test => {
      let strategySpy = Sinon.spy()
      let server = {
        auth: {
          scheme: Sinon.spy(),
          strategy: strategySpy
        }
      }

      let next = () => {
        test.ok(strategySpy.calledWith(TokenStrategy.name, 'bearer', Sinon.match({ validate: TokenStrategy.validate })))
        test.end()
      }

      AuthModule.register(server, null, next)
    })

    registerTest.end()
  })

  moduleTest.test('should be named "auth-strategies"', test => {
    test.equal(AuthModule.register.attributes.name, 'auth-strategies')
    test.end()
  })

  moduleTest.test('strategy should', strategyTest => {
    strategyTest.test('return token if ENABLE_TOKEN_AUTH true', test => {
      Config.ENABLE_TOKEN_AUTH = true
      test.deepEqual(AuthModule.strategy(), { strategy: 'token', mode: 'required' })
      test.end()
    })

    strategyTest.test('return dfsp if ENABLE_TOKEN_AUTH false', test => {
      Config.ENABLE_TOKEN_AUTH = false
      test.deepEqual(AuthModule.strategy(), { strategy: 'dfsp', mode: 'required' })
      test.end()
    })

    strategyTest.end()
  })

  moduleTest.end()
})
