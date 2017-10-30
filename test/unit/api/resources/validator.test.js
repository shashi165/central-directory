'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const InvalidQueryParameterError = require('@mojaloop/central-services-error-handling').InvalidQueryParameterError
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
    getTest.test('reject with InvalidQueryParameterError if identifierType is not registered', test => {
      let identifierType = 'test'
      let query = { identifierType: identifierType, identifier: 'test' }

      Registry.byIdentifierType.withArgs(identifierType).returns(P.resolve(null))
      Validator.get(query)
        .then(() => {
          test.fail('Expected InvalidQueryParameterError')
          test.end()
        })
        .catch(InvalidQueryParameterError, e => {
          test.equal(e.message, 'Error validating one or more query parameters')
          test.deepEqual(e.payload.validationErrors, [{
            message: '\'test\' is not a registered identifierType',
            params: {
              key: 'identifierType',
              value: identifierType
            }
          }])
          test.end()
        })
        .catch(e => {
          test.fail('Expected InvalidQueryParameterError')
          test.end()
        })
    })

    getTest.test('reject with InvalidQueryParameterError if identifier is not valid format for directory', test => {
      let identifier = 'test_id'
      let identifierType = 'test_type'
      let query = { identifierType: identifierType, identifier: identifier }

      let directory = {
        isIdentifierValid: () => false
      }

      Registry.byIdentifierType.withArgs(identifierType).returns(P.resolve(directory))

      Validator.get(query)
        .then(() => {
          test.fail('Expected InvalidQueryParameterError')
          test.end()
        })
        .catch(InvalidQueryParameterError, e => {
          test.equal(e.message, 'Error validating one or more query parameters')
          test.deepEqual(e.payload.validationErrors, [{
            message: '\'test_id\' is not a valid identifier for identifierType \'test_type\'',
            params: {
              key: 'identifier',
              value: identifier
            }
          }])
          test.end()
        })
        .catch(e => {
          test.fail('Expected InvalidQueryParameterError')
          test.end()
        })
    })

    getTest.test('resolve identifierType, identifier and directory from query parameters', test => {
      let identifierType = 'test'
      let identifier = 'test identifier'
      let directory = {
        isIdentifierValid: () => true
      }
      Registry.byIdentifierType.returns(P.resolve(directory))
      let query = { identifierType: identifierType, identifier: identifier }

      Validator.get(query)
        .then(result => {
          test.equal(result.identifierType, identifierType)
          test.equal(result.identifier, identifier)
          test.equal(result.directory, directory)
          test.end()
        })
    })

    getTest.end()
  })
  validatorTest.end()
})
