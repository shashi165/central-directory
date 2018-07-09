'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Glob = require('glob')
const Proxyquire = require('proxyquire')
const Registry = require('../../../../src/domain/directory/registry')

Test('Directories module', moduleTest => {
  moduleTest.test('register should', registerTest => {
    registerTest.test('register directories with identifier and descriptions', async function (test) {
      let file1Name = 'test.js'
      let file1Object = { identifierType: 't', description: 't', '@noCallThru': true }
      let file2Name = 'test2.js'
      let file2Object = { identifierType: 't2', description: 't2', '@noCallThru': true }
      let file3Name = 'test3.js'
      let file3Object = { '@noCallThru': true }

      Sinon.stub(Glob, 'sync')
      Glob.sync.returns([file1Name, file2Name, file3Name])

      Sinon.stub(Registry)
      Registry.register = { apply: Sinon.stub().returns(P.resolve()) }

      let stubs = {
        'glob': Glob,
        './registry': Registry,
        './test.js': file1Object,
        './test2.js': file2Object,
        './test3.js': file3Object
      }

      let Module = Proxyquire('../../../../src/domain/directory', stubs)
      test.equal(Module.plugin.name, 'directory-registration')

      Module.plugin.register({}, {})
      test.ok(Registry.register.apply.calledOnce)
      test.deepEqual(Registry.register.apply.firstCall.args[1], [file1Object, file2Object])
      test.end()
    })

    registerTest.end()
  })

  moduleTest.end()
})
