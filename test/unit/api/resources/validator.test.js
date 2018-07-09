'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Registry = require('../../../../src/domain/directory/registry')
const Validator = require('../../../../src/api/resources/validator')

Test('resource validator', validatorTest => {
  let sandbox

  validatorTest.beforeEach(t => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Registry, 'byIdentifierType')
    t.end()
  })

  validatorTest.afterEach(t => {
    sandbox.restore()
    t.end()
  })

  validatorTest.test('get should', getTest => {
    getTest.test('reject with InvalidQueryParameterError if identifierType is not registered', async test => {
      let identifierType = 'test'
      let query = { identifierType: identifierType, identifier: 'test' }

      try {
        await Validator.get(query)
        test.fail('Expected InvalidQueryParameterError')
        test.end()
      } catch (err) {
        test.equal(err.name, 'InvalidQueryParameterError')
        test.equal(err.payload.message, 'Error validating one or more query parameters')
        test.deepEqual(err.payload.validationErrors, [{
          message: '\'test\' is not a registered identifierType',
          params: {
            key: 'identifierType',
            value: identifierType
          }
        }])
        test.end()
      }
    })

    getTest.test('reject with InvalidQueryParameterError if identifier is not valid format for directory', async test => {
      let identifier = 'test_id'
      let identifierType = 'test_type'
      let query = { identifierType: identifierType, identifier: identifier }

      let directory = {
        isIdentifierValid: () => false
      }

      Registry.byIdentifierType.withArgs(identifierType).returns(P.resolve(directory))
      try {
        await Validator.get(query)
        test.fail('Expected InvalidQueryParameterError')
        test.end()
      } catch (err) {
        test.equal(err.name, 'InvalidQueryParameterError')
        test.equal(err.payload.message, 'Error validating one or more query parameters')
        test.deepEqual(err.payload.validationErrors, [{
          message: '\'test_id\' is not a valid identifier for identifierType \'test_type\'',
          params: {
            key: 'identifier',
            value: identifier
          }
        }])
        test.end()
      }
    })

    getTest.test('resolve identifierType, identifier and directory from query parameters', async test => {
      let identifierType = 'test'
      let identifier = 'test identifier'
      let directory = {
        isIdentifierValid: () => true
      }
      Registry.byIdentifierType.returns(P.resolve(directory))
      let query = { identifierType: identifierType, identifier: identifier }

      const result = await Validator.get(query)
      test.equal(result.identifierType, identifierType)
      test.equal(result.identifier, identifier)
      test.equal(result.directory, directory)
      test.end()
    })

    getTest.end()
  })
  validatorTest.end()
})
