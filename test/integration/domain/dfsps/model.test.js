'use strict'

const Test = require('tape')
const Model = require('../../../../src/domain/dfsp/model')

function createDfsp (name, shortName, key, secretHash, dfspSchemeIdentifier, url) {
  const payload = { name, shortName, key, secretHash, dfspSchemeIdentifier, url }
  return Model.create(payload)
}

Test('dfsps model', modelTest => {
  modelTest.test('create should', createTest => {
    createTest.test('create a new dfsp', test => {
      const dfspName = 'dfsp1'
      const dfspShortName = 'dfsp1'
      const dfspKey = 'dfsp1'
      const dfspHashedSecret = 'some-secret'
      const dfspSchemeIdentifier = '100'
      const dfspUrl = 'http://dfsp-1.com'

      createDfsp(dfspName, dfspShortName, dfspKey, dfspHashedSecret, dfspSchemeIdentifier, dfspUrl)
        .then((dfsp) => {
          test.ok(dfsp.dfspId)
          test.ok(dfsp.createdDate)
          test.equal(dfsp.name, dfspName)
          test.equal(dfsp.shortName, dfspShortName)
          test.equal(dfsp.key, dfspKey)
          test.equal(dfsp.secretHash, dfspHashedSecret)
          test.equal(dfsp.dfspSchemeIdentifier, dfspSchemeIdentifier)
          test.equal(dfsp.url, dfspUrl)
          test.end()
        })
    })

    createTest.end()
  })

  modelTest.test('getByName should', getByNameTest => {
    getByNameTest.test('get dfsp by name', test => {
      const dfspName = 'dfsp2'
      const dfspShortName = 'dfsp2'
      const dfspKey = 'dfsp2'
      const dfspHashedSecret = 'some-secret'
      const dfspSchemeIdentifier = '101'
      const dfspUrl = 'http://dfsp-2.com'

      createDfsp(dfspName, dfspShortName, dfspKey, dfspHashedSecret, dfspSchemeIdentifier, dfspUrl)
        .then((dfsp) => {
          Model.getByName(dfsp.name)
            .then((found) => {
              test.notEqual(found, dfsp)
              test.equal(found.dfspId, dfsp.dfspId)
              test.equal(found.name, dfsp.name)
              test.equal(dfsp.shortName, dfspShortName)
              test.equal(found.key, dfsp.key)
              test.equal(found.secretHash, dfsp.secretHash)
              test.equal(found.dfspSchemeIdentifier, dfsp.dfspSchemeIdentifier)
              test.equal(found.url, dfsp.url)
              test.deepEqual(found.createdDate, dfsp.createdDate)
              test.end()
            })
        })
    })

    getByNameTest.end()
  })

  modelTest.test('getByDfspSchemeIdentifier should', getByIdentifierTest => {
    getByIdentifierTest.test('get dfsp by dfspSchemeIdentifier', test => {
      const dfspName = 'dfsp3'
      const dfspShortName = 'dfsp3'
      const dfspKey = 'dfsp3'
      const dfspHashedSecret = 'some-secret'
      const dfspSchemeIdentifier = '102'
      const dfspUrl = 'http://dfsp-3.com'

      createDfsp(dfspName, dfspShortName, dfspKey, dfspHashedSecret, dfspSchemeIdentifier, dfspUrl)
        .then((dfsp) => {
          Model.getByDfspSchemeIdentifier(dfsp.dfspSchemeIdentifier)
            .then((found) => {
              test.notEqual(found, dfsp)
              test.equal(found.dfspId, dfsp.dfspId)
              test.equal(found.name, dfsp.name)
              test.equal(found.shortName, dfsp.shortName)
              test.equal(found.key, dfsp.key)
              test.equal(found.secretHash, dfsp.secretHash)
              test.equal(found.dfspSchemeIdentifier, dfsp.dfspSchemeIdentifier)
              test.equal(found.url, dfsp.url)
              test.deepEqual(found.createdDate, dfsp.createdDate)
              test.end()
            })
        })
    })

    getByIdentifierTest.end()
  })

  modelTest.end()
})
