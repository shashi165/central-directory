'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')

const Config = require('../../../../src/lib/config')
const Service = require('../../../../src/domain/dfsp')
const Handler = require('../../../../src/api/commands/handler')

Test('commands handler', handlerTest => {
  let sandbox
  let oldSchemeId
  const schemeId = '005'

  handlerTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Service, 'create')

    oldSchemeId = Config.SCHEME_ID
    Config.SCHEME_ID = schemeId

    t.end()
  })

  handlerTest.afterEach(t => {
    sandbox.restore()
    Config.SCHEME_ID = oldSchemeId
    t.end()
  })

  handlerTest.test('create should', createTest => {
    createTest.test('create dfsp and return', test => {
      const dfspName = 'the dfsp1'
      const dfspShortName = 'dfsp1'
      const dfspUrl = 'http://test.com'
      const dfspSchemeIdentifier = '456'

      const request = {
        payload: {
          name: dfspName,
          shortName: dfspShortName,
          providerUrl: dfspUrl
        }
      }

      const createdDfsp = { name: dfspName, shortName: dfspShortName, url: dfspUrl, dfspSchemeIdentifier }
      Service.create.returns(P.resolve(createdDfsp))

      const responseDfsp = {
        name: dfspName,
        shortName: dfspShortName,
        providerUrl: dfspUrl,
        key: dfspName,
        secret: dfspName
      }

      const reply = {
        response: (result) => {
          return {
            code: statusCode => {
              test.equal(statusCode, 201)
              test.deepEqual(result, responseDfsp)
              test.ok(Service.create.calledWith(dfspName, dfspShortName, dfspUrl))
              test.end()
            }
          }
        }
      }

      Handler.create(request, reply)
    })

    createTest.test('reply with error if Service create returns error', async function (test) {
      const error = new Error()
      Service.create.returns(P.reject(error))

      const request = {
        payload: {
          name: 'dfspName'
        }
      }
      try {
        await Handler.create(request, {})
      } catch (e) {
        test.equal(e, error)
        test.end()
      }
    })

    createTest.end()
  })

  handlerTest.end()
})
