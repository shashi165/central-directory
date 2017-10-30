'use strict'

const Test = require('tape')
const TestDirectory = require('../../../../src/domain/directories/test-directory')

Test('test directory', directoryTest => {
  directoryTest.test('identifierType should be \'test\'', test => {
    test.equal(TestDirectory.identifierType, 'test')
    test.end()
  })

  directoryTest.test('description should be \'test\'', test => {
    test.equal(TestDirectory.description, 'test')
    test.end()
  })

  directoryTest.test('find should return formatted link', test => {
    TestDirectory.find(1, (err, result) => {
      test.notOk(err)
      test.equal(result, 'http://example.directory/users/1')
      test.end()
    })
  })

  directoryTest.test('find should nothing if id > 10', test => {
    TestDirectory.find(11, (err, result) => {
      test.notOk(err)
      test.notOk(result)
      test.end()
    })
  })

  directoryTest.test('find should error if id is negative', test => {
    TestDirectory.find(-1, (err, result) => {
      test.ok(err)
      test.notOk(result)
      test.end()
    })
  })
  directoryTest.end()
})
