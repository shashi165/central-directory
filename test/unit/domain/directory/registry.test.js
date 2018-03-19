'use strict'

const Test = require('tapes')(require('tape'))
const InvalidDirectoryError = require('../../../../src/errors/invalid-directory-error')
const RegistryPath = '../../../../src/domain/directory/registry'

let Registry

const assertInvalidDirectoryError = (test, directory, message) => {
  return Registry.register(directory)
    .then(() => {
      test.fail('Expected InvalidDirectoryError')
      test.end()
    })
    .catch(InvalidDirectoryError, e => {
      test.equal(e.message, message)
      test.end()
    })
    .catch(e => {
      test.fail('Expected InvalidDirectoryError')
      test.end()
    })
}

Test('directory registry test', registryTest => {
  registryTest.beforeEach(t => {
    Registry = require(RegistryPath)
    t.end()
  })

  registryTest.afterEach(t => {
    delete require.cache[require.resolve(RegistryPath)]
    t.end()
  })

  registryTest.test('register should', registerTest => {
    registerTest.test('throw exception if directory does not define identifierType', test => {
      let d = () => { return {} }
      return assertInvalidDirectoryError(test, d, 'Directory does not implement required property \'identifierType\'')
    })

    registerTest.test('throw exception if identifierType is not string', test => {
      let d = () => { return { identifierType: () => {} } }
      return assertInvalidDirectoryError(test, d, '\'identifierType\' must be a string')
    })

    registerTest.test('throw exception if directory does not define description', test => {
      let d = () => { return { identifierType: 'test' } }
      return assertInvalidDirectoryError(test, d, 'Directory does not implement required property \'description\'')
    })

    registerTest.test('throw exception if description is not string', test => {
      let d = () => { return { identifierType: 'test', description: 1 } }
      return assertInvalidDirectoryError(test, d, '\'description\' must be a string')
    })

    registerTest.test('throw exception if directory does not define find function', test => {
      let d = () => {
        return {
          identifierType: 'test',
          description: 'test'
        }
      }
      return assertInvalidDirectoryError(test, d, 'Directory does not implement required function \'find\'')
    })

    registerTest.test('throw exception if find is not a function', test => {
      let d = () => {
        return {
          identifierType: 'test',
          description: 'test',
          find: 'not a function'
        }
      }
      return assertInvalidDirectoryError(test, d, '\'find\' must be a function')
    })

    registerTest.test('throw exception if format is not regex or function', test => {
      let d = () => {
        return {
          identifierType: 'test',
          description: 'test',
          find: () => {},
          format: 1
        }
      }

      return assertInvalidDirectoryError(test, d, '\'format\' must be a regular expression or function')
    })

    registerTest.test('register object', test => {
      let d = {
        identifierType: 'test',
        description: 'test',
        find: () => {}
      }

      return Registry.register(d)
        .then(entries => {
          test.equal(entries.length, 1)
          let entry = entries[0]
          test.ok(entry)
          test.equal(entry.identifierType, d.identifierType)
          test.equal(entry.description, d.description)
          test.equal(entry.find, d.find)
          test.ok(entry.isIdentifierValid('value'))
          test.end()
        })
    })

    registerTest.test('register multiple directories', test => {
      let a = { identifierType: 'a', description: 'test', find: () => {} }
      let b = { identifierType: 'b', description: 'test', find: () => {} }

      return Registry.register(a, b)
        .then(entries => {
          test.equal(entries.length, 2)
          test.equal(entries[0].identifierType, a.identifierType)
          test.equal(entries[1].identifierType, b.identifierType)
          test.end()
        })
    })

    registerTest.test('throw exception if registering same identifierType twice', test => {
      let a = { identifierType: 'a', description: 'test', find: () => {} }

      Registry.register(a)
        .then(() => assertInvalidDirectoryError(test, a, 'Directory with \'identifierType\' = \'a\' has already been registered'))
    })

    registerTest.test('throw exception if registering same identifierType together', test => {
      let a = { identifierType: 'a', description: 'test', find: () => {} }

      Registry.register(a, a)
        .then(() => {
          test.fail('Expected InvalidDirectoryError')
          test.end()
        })
        .catch(InvalidDirectoryError, e => {
          test.equal(e.message, 'Directory with \'identifierType\' = \'a\' has already been registered')
          test.end()
        })
        .catch(e => {
          test.fail('Expected InvalidDirectoryError')
          test.end()
        })
    })

    registerTest.end()
  })

  registryTest.test('byIdentifierType should', byTypeTest => {
    byTypeTest.test('return empty if identifierType not registered', test => {
      return Registry.byIdentifierType('test')
        .then(result => {
          test.notOk(result)
          test.end()
        })
    })

    byTypeTest.test('return directory by identifierType', test => {
      let a = { identifierType: 'a', description: 'test', find: () => {} }
      Registry.register(a)
        .then(() => Registry.byIdentifierType(a.identifierType))
        .then(result => {
          test.ok(result)
          test.equal(result.identifierType, a.identifierType)
          test.equal(result.description, a.description)
          test.equal(result.find, a.find)
          test.ok(result.isIdentifierValid('any value whatsoever'))
          test.end()
        })
    })

    byTypeTest.test('return directory with format function from regexp', test => {
      let a = { identifierType: 'a', description: 'test', find: () => {}, format: /\d/g }
      Registry.register(a)
        .then(() => Registry.byIdentifierType(a.identifierType))
        .then(result => {
          test.ok(result.isIdentifierValid(1))
          test.end()
        })
    })

    byTypeTest.test('return directory with format function from function', test => {
      let a = { identifierType: 'a', description: 'test', find: () => {}, format: (v) => v > 1000 }
      Registry.register(a)
        .then(() => Registry.byIdentifierType(a.identifierType))
        .then(result => {
          test.notOk(result.isIdentifierValid(1))
          test.ok(result.isIdentifierValid(1001))
          test.end()
        })
    })

    byTypeTest.end()
  })

  registryTest.test('identifierTypes should', typesTest => {
    typesTest.test('be empty if no directories registered', test => {
      Registry.identifierTypes()
        .then(result => {
          test.equal(result.length, 0)
          test.end()
        })
    })

    typesTest.test('return identifierType and description for each directory registered', test => {
      Registry.register(
        { identifierType: 'a', description: 'a description', find: () => {} },
        { identifierType: 'b', description: 'b description', find: () => {} },
        { identifierType: 'c', description: 'c description', find: () => {} }
      )
        .then(() => Registry.identifierTypes())
        .then(types => {
          test.equal(types.length, 3)
          test.deepEqual(types[0], { identifierType: 'a', description: 'a description' })
          test.deepEqual(types[1], { identifierType: 'b', description: 'b description' })
          test.deepEqual(types[2], { identifierType: 'c', description: 'c description' })
          test.end()
        })
    })
    typesTest.end()
  })

  registryTest.end()
})
