'use strict'

const Test = require('tapes')(require('tape'))
const Sinon = require('sinon')
const P = require('bluebird')
const Cache = require('memory-cache')
const Logger = require('@mojaloop/central-services-shared').Logger
const Proxyquire = require('proxyquire')
const Config = require('../../../../src/lib/config')
const ProvisioningErrors = require('@mojaloop/pathfinder-provisioning-client').Errors

Test('Pathfinder directory tests', pathfinderTest => {
  let sandbox
  let oldSchemeId
  let oldPFAddress
  let oldPFPort
  let oldPFTimeout
  let oldPFService
  let oldPFPartnerId
  let oldPFRegexPattern
  let oldPFRegexReplace
  let oldPFCacheTime

  let recordStub
  let profileStub
  let queryClientStub
  let createQueryClientStub
  let provisioningClientStub
  let createProvisioningClientStub
  let PathFinder

  const schemeId = '010'
  const pathFinderAddress = 'http://test-pf.com'
  const pathFinderPort = 5199
  const pathFinderTimeout = 1000
  const pathFinderService = 'E2U+test'
  const pathFinderPartnerId = 50
  const pathFinderRegexPattern = '^(.*)$'
  const pathFinderRegexReplace = 'ts:#{identifier}@test.com'
  const pathFinderCacheTime = 60000

  pathfinderTest.beforeEach(test => {
    sandbox = Sinon.sandbox.create()
    sandbox.stub(Cache)
    sandbox.stub(Logger)

    setupConfig()

    queryClientStub = sandbox.stub()
    createQueryClientStub = sandbox.stub()
    createQueryClientStub.returns(queryClientStub)

    provisioningClientStub = sandbox.stub()
    recordStub = sandbox.stub()
    profileStub = sandbox.stub()
    createProvisioningClientStub = sandbox.stub()
    createProvisioningClientStub.returns(provisioningClientStub)

    PathFinder = Proxyquire('../../../../src/domain/directory/pathfinder', {
      '@mojaloop/pathfinder-provisioning-client': { createClient: createProvisioningClientStub, Record: recordStub, Profile: profileStub },
      '@mojaloop/pathfinder-query-client': { createClient: createQueryClientStub }
    })

    test.end()
  })

  pathfinderTest.afterEach(test => {
    sandbox.restore()
    resetConfig()
    test.end()
  })

  const setupConfig = () => {
    oldSchemeId = Config.SCHEME_ID
    oldPFAddress = Config.PATHFINDER.QUERY.ADDRESS
    oldPFPort = Config.PATHFINDER.QUERY.PORT
    oldPFTimeout = Config.PATHFINDER.QUERY.TIMEOUT
    oldPFService = Config.PATHFINDER.SERVICE
    oldPFPartnerId = Config.PATHFINDER.PARTNER_ID
    oldPFRegexPattern = Config.PATHFINDER.REGEX.PATTERN
    oldPFRegexReplace = Config.PATHFINDER.REGEX.REPLACE
    oldPFCacheTime = Config.PATHFINDER.CACHE_TIME

    Config.SCHEME_ID = schemeId
    Config.PATHFINDER.QUERY.ADDRESS = pathFinderAddress
    Config.PATHFINDER.QUERY.PORT = pathFinderPort
    Config.PATHFINDER.QUERY.TIMEOUT = pathFinderTimeout
    Config.PATHFINDER.SERVICE = pathFinderService
    Config.PATHFINDER.PARTNER_ID = pathFinderPartnerId
    Config.PATHFINDER.REGEX.PATTERN = pathFinderRegexPattern
    Config.PATHFINDER.REGEX.REPLACE = pathFinderRegexReplace
    Config.PATHFINDER.CACHE_TIME = pathFinderCacheTime
  }

  const resetConfig = () => {
    Config.SCHEME_ID = oldSchemeId
    Config.PATHFINDER.QUERY.ADDRESS = oldPFAddress
    Config.PATHFINDER.QUERY.PORT = oldPFPort
    Config.PATHFINDER.QUERY.TIMEOUT = oldPFTimeout
    Config.PATHFINDER.SERVICE = oldPFService
    Config.PATHFINDER.PARTNER_ID = oldPFPartnerId
    Config.PATHFINDER.REGEX.PATTERN = oldPFRegexPattern
    Config.PATHFINDER.REGEX.REPLACE = oldPFRegexReplace
    Config.PATHFINDER.CACHE_TIME = oldPFCacheTime
  }

  pathfinderTest.test('identifierType should be "tel"', test => {
    test.equal(PathFinder.identifierType, 'tel')
    test.end()
  })

  pathfinderTest.test('decription', test => {
    test.equal(PathFinder.description, 'E.164 phone number')
    test.end()
  })

  pathfinderTest.test('find should', findTest => {
    findTest.test('throw error for invalid identifier', test => {
      let identifier = '14441235555a'

      PathFinder.find(identifier, (err, res) => {
        test.notOk(res)
        test.equal(err.name, 'InvalidIdentifierError')
        test.equal(err.message, 'The phone number must be in E.164 format')
        test.end()
      })
    })

    findTest.test('call PathFinder and return records', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '504'

      let queryResponse = {
        tn: `+${identifier}`,
        records: [
          {
            order: 10,
            preference: 1,
            service: pathFinderService,
            regexp: {
              pattern: /^(.*)$/,
              replace: `mm:${schemeId}.${dfspSchemeIdentifier}@mojaloop.org`
            }
          }
        ]
      }

      Cache.get.returns(null)

      queryClientStub.request = sandbox.stub()
      queryClientStub.request.returns(P.resolve(queryResponse))

      PathFinder.find(identifier, (err, res) => {
        test.notOk(err)
        test.ok(Cache.get.calledWith(identifier))
        test.ok(Logger.info.calledWith(`${identifier} not found in cache, querying PathFinder`))
        test.ok(createQueryClientStub.calledOnce)
        test.ok(createQueryClientStub.calledWith(sandbox.match({ address: pathFinderAddress, port: pathFinderPort, timeout: pathFinderTimeout })))
        test.ok(queryClientStub.request.calledWith(identifier))
        test.equal(1, res.length)
        test.equal(res[0].identifier, identifier)
        test.equal(res[0].schemeIdentifier, schemeId)
        test.equal(res[0].dfspSchemeIdentifier, dfspSchemeIdentifier)
        test.end()
      })
    })

    findTest.test('use cache and return records', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '504'

      let queryResponse = {
        tn: `+${identifier}`,
        records: [
          {
            order: 10,
            preference: 1,
            service: pathFinderService,
            regexp: {
              pattern: /^(.*)$/,
              replace: `mm:${schemeId}.${dfspSchemeIdentifier}@mojaloop.org`
            }
          }
        ]
      }

      Cache.get.returns(queryResponse.records)

      queryClientStub.request = sandbox.stub()
      queryClientStub.request.returns(P.resolve(queryResponse))

      PathFinder.find(identifier, (err, res) => {
        test.notOk(err)
        test.ok(Cache.get.calledWith(identifier))
        test.ok(Logger.info.calledWith(`Found ${identifier} in cache, returning cached records`))
        test.ok(createQueryClientStub.calledOnce)
        test.ok(createQueryClientStub.calledWith(sandbox.match({ address: pathFinderAddress, port: pathFinderPort, timeout: pathFinderTimeout })))
        test.equal(1, res.length)
        test.equal(res[0].identifier, identifier)
        test.equal(res[0].schemeIdentifier, schemeId)
        test.equal(res[0].dfspSchemeIdentifier, dfspSchemeIdentifier)
        test.end()
      })
    })

    findTest.test('turn identifier to digits before checking cache', test => {
      let identifier = '+14441235555'
      let dfspSchemeIdentifier = '504'

      let queryResponse = {
        tn: `+${identifier}`,
        records: [
          {
            order: 10,
            preference: 1,
            service: pathFinderService,
            regexp: {
              pattern: /^(.*)$/,
              replace: `mm:${schemeId}.${dfspSchemeIdentifier}@mojaloop.org`
            }
          }
        ]
      }

      Cache.get.returns(queryResponse.records)

      queryClientStub.request = sandbox.stub()
      queryClientStub.request.returns(P.resolve(queryResponse))

      PathFinder.find(identifier, (err, res) => {
        test.notOk(err)
        test.ok(Cache.get.calledWith(identifier.substring(1)))
        test.ok(createQueryClientStub.calledOnce)
        test.ok(createQueryClientStub.calledWith(sandbox.match({ address: pathFinderAddress, port: pathFinderPort, timeout: pathFinderTimeout })))
        test.equal(1, res.length)
        test.equal(res[0].identifier, identifier)
        test.equal(res[0].schemeIdentifier, schemeId)
        test.equal(res[0].dfspSchemeIdentifier, dfspSchemeIdentifier)
        test.end()
      })
    })

    findTest.test('ignore record with incorrect service stored in PathFinder', test => {
      let identifier = '14441235555'

      let queryResponse = {
        tn: `+${identifier}`,
        records: [
          {
            order: 10,
            preference: 50,
            service: 'E2U+pstn:tel',
            regexp: {
              pattern: /^(.*)$/,
              replace: 'tel:$1;npdi;spn=41077;q_stat=001'
            }
          }
        ]
      }

      queryClientStub.request = sandbox.stub()
      queryClientStub.request.returns(P.resolve(queryResponse))

      PathFinder.find(identifier, (err, res) => {
        test.notOk(res)
        test.equal(err.message, 'No valid records could be found for the requested phone number')
        test.end()
      })
    })

    findTest.test('ignore record with invalid URI stored in PathFinder', test => {
      let identifier = '14441235555'

      let queryResponse = {
        tn: `+${identifier}`,
        records: [
          {
            order: 10,
            preference: 1,
            service: pathFinderService,
            regexp: {
              pattern: /^(.*)$/,
              replace: `mm:invalid@mojaloop.org`
            }
          }
        ]
      }

      queryClientStub.request = sandbox.stub()
      queryClientStub.request.returns(P.resolve(queryResponse))

      PathFinder.find(identifier, (err, res) => {
        test.notOk(res)
        test.equal(err.message, 'No valid records could be found for the requested phone number')
        test.end()
      })
    })

    findTest.test('handle no records returned from PathFinder', test => {
      let identifier = '14441235555'

      let queryResponse = {
        tn: `+${identifier}`,
        records: []
      }

      queryClientStub.request = sandbox.stub()
      queryClientStub.request.returns(P.resolve(queryResponse))

      PathFinder.find(identifier, (err, res) => {
        test.notOk(res)
        test.equal(err.message, 'No valid records could be found for the requested phone number')
        test.end()
      })
    })

    findTest.test('sort multiple valid PathFinder records by order then preference', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '504'
      let dfsp2SchemeIdentifier = '111'

      let queryResponse = {
        tn: `+${identifier}`,
        records: [
          {
            order: 10,
            preference: 10,
            service: pathFinderService,
            regexp: {
              pattern: /^(.*)$/,
              replace: `mm:${schemeId}.${dfspSchemeIdentifier}@mojaloop.org`
            }
          },
          {
            order: 10,
            preference: 1,
            service: pathFinderService,
            regexp: {
              pattern: /^(.*)$/,
              replace: `mm:${schemeId}.${dfsp2SchemeIdentifier}@mojaloop.org`
            }
          }
        ]
      }

      queryClientStub.request = sandbox.stub()
      queryClientStub.request.returns(P.resolve(queryResponse))

      PathFinder.find(identifier, (err, res) => {
        test.notOk(err)
        test.equal(2, res.length)
        test.equal(res[0].identifier, identifier)
        test.equal(res[0].schemeIdentifier, schemeId)
        test.equal(res[0].dfspSchemeIdentifier, dfsp2SchemeIdentifier)
        test.equal(res[1].identifier, identifier)
        test.equal(res[1].schemeIdentifier, schemeId)
        test.equal(res[1].dfspSchemeIdentifier, dfspSchemeIdentifier)
        test.end()
      })
    })

    findTest.test('handle error thrown by PathFinder client and return InternalError', test => {
      let identifier = '14441235555'

      let requestError = new Error('Bad stuff is happening')
      queryClientStub.request = sandbox.stub()
      queryClientStub.request.returns(P.reject(requestError))

      PathFinder.find(identifier, (err, res) => {
        test.notOk(res)
        test.notEqual(err, requestError)
        test.equal(err.name, 'InternalError')
        test.equal(err.message, 'Unhandled error querying phone number')
        test.end()
      })
    })

    findTest.end()
  })

  pathfinderTest.test('registerIdentifier should', registerTest => {
    registerTest.test('throw error for invalid identifier', test => {
      let identifier = '14441235555a'
      let dfspSchemeIdentifier = '001'

      PathFinder.registerIdentifier({ identifier, dfspSchemeIdentifier }, (err, res) => {
        test.notOk(res)
        test.equal(err.name, 'InvalidIdentifierError')
        test.equal(err.message, 'The phone number must be in E.164 format')
        test.end()
      })
    })

    registerTest.test('create new profile and activate', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '001'
      let newProfileId = `Profile-${identifier}`

      let newRecord = {}
      recordStub.returns(newRecord)

      let newProfile = { addRecord: sandbox.stub() }
      profileStub.returns(newProfile)

      const notFoundError = new ProvisioningErrors.NotFoundError(404, [])

      provisioningClientStub.getProfileForPhoneNumber = sandbox.stub().returns(P.reject(notFoundError))
      provisioningClientStub.findProfile = sandbox.stub().returns(P.reject(notFoundError))
      provisioningClientStub.createProfile = sandbox.stub().returns(P.resolve())
      provisioningClientStub.activatePhoneNumber = sandbox.stub().returns(P.resolve())

      PathFinder.registerIdentifier({ identifier, dfspSchemeIdentifier }, (err, res) => {
        test.notOk(err)
        test.ok(provisioningClientStub.getProfileForPhoneNumber.calledWith(identifier))
        test.ok(provisioningClientStub.findProfile.calledWith(newProfileId))
        test.ok(recordStub.calledWith(sandbox.match({
          order: 10,
          preference: 1,
          service: pathFinderService,
          partnerId: pathFinderPartnerId,
          regexp: {
            pattern: pathFinderRegexPattern,
            replace: pathFinderRegexReplace.replace('#{identifier}', `${schemeId}.${dfspSchemeIdentifier}`)
          }
        })))
        test.ok(profileStub.calledWith(sandbox.match({ id: newProfileId })))
        test.ok(newProfile.addRecord.calledWith(newRecord))
        test.ok(provisioningClientStub.createProfile.calledWith(newProfile))
        test.ok(provisioningClientStub.activatePhoneNumber.calledWith(identifier, newProfileId))
        test.ok(Logger.info.calledWith(`No activated profile found for ${identifier}`))
        test.ok(Logger.info.calledWith(`Profile ${newProfileId} not found, creating new`))
        test.ok(Logger.info.calledWith(`Activating profile ${newProfileId} for phone number ${identifier}`))
        test.ok(Cache.put.calledWith(identifier, newProfile.records, pathFinderCacheTime))
        test.deepEqual(res, { identifier, schemeIdentifier: schemeId, dfspSchemeIdentifier, primary: false })
        test.end()
      })
    })

    registerTest.test('throw error if unknown status getting profile for phone number', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '001'

      const serverError = new ProvisioningErrors.ServerError(500, [])

      provisioningClientStub.getProfileForPhoneNumber = sandbox.stub().returns(P.reject(serverError))

      PathFinder.registerIdentifier({ identifier, dfspSchemeIdentifier }, (err, res) => {
        test.notOk(res)
        test.ok(Logger.error.calledWith(`Unhandled error when registering phone number ${identifier}`, serverError))
        test.equal(err.message, 'Unhandled error registering phone number')
        test.end()
      })
    })

    registerTest.test('throw error if unknown status finding profile', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '001'
      let profileId = 'TestProfile'

      let getResponse = {
        code: 200,
        data: {
          profileId
        }
      }

      const serverError = new ProvisioningErrors.ServerError(500, [])

      provisioningClientStub.getProfileForPhoneNumber = sandbox.stub().returns(P.resolve(getResponse))
      provisioningClientStub.findProfile = sandbox.stub().returns(P.reject(serverError))

      PathFinder.registerIdentifier({ identifier, dfspSchemeIdentifier }, (err, res) => {
        test.notOk(res)
        test.ok(Logger.error.calledWith(`Unhandled error when registering phone number ${identifier}`, serverError))
        test.equal(err.message, 'Unhandled error registering phone number')
        test.end()
      })
    })

    registerTest.test('update unactivated profile and activate', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '001'
      let newProfileId = `Profile-${identifier}`

      const notFoundError = new ProvisioningErrors.NotFoundError(404, [])

      let newRecord = {}
      recordStub.returns(newRecord)

      let existingProfile = { id: newProfileId, clearRecords: sandbox.stub(), addRecord: sandbox.stub(), records: [newRecord] }

      let findResponse = {
        code: 200,
        data: {
          profile: existingProfile
        }
      }

      provisioningClientStub.getProfileForPhoneNumber = sandbox.stub().returns(P.reject(notFoundError))
      provisioningClientStub.findProfile = sandbox.stub().returns(P.resolve(findResponse))
      provisioningClientStub.updateProfile = sandbox.stub().returns(P.resolve())
      provisioningClientStub.activatePhoneNumber = sandbox.stub().returns(P.resolve())

      PathFinder.registerIdentifier({ identifier, dfspSchemeIdentifier }, (err, res) => {
        test.notOk(err)
        test.ok(provisioningClientStub.getProfileForPhoneNumber.calledWith(identifier))
        test.ok(provisioningClientStub.findProfile.calledWith(newProfileId))
        test.ok(recordStub.calledWith(sandbox.match({
          order: 10,
          preference: 1,
          service: pathFinderService,
          partnerId: pathFinderPartnerId,
          regexp: {
            pattern: pathFinderRegexPattern,
            replace: pathFinderRegexReplace.replace('#{identifier}', `${schemeId}.${dfspSchemeIdentifier}`)
          }
        })))
        test.ok(existingProfile.clearRecords.calledOnce)
        test.ok(existingProfile.addRecord.calledWith(newRecord))
        test.ok(provisioningClientStub.updateProfile.calledWith(sandbox.match({ id: newProfileId })))
        test.ok(provisioningClientStub.activatePhoneNumber.calledWith(identifier, newProfileId))
        test.ok(Logger.info.calledWith(`No activated profile found for ${identifier}`))
        test.ok(Logger.info.calledWith(`Inactivated profile ${newProfileId} found, clearing existing records and adding new record`))
        test.ok(Logger.info.calledWith(`Activating profile ${newProfileId} for phone number ${identifier}`))
        test.ok(Cache.put.calledWith(identifier, existingProfile.records, pathFinderCacheTime))
        test.deepEqual(res, { identifier, schemeIdentifier: schemeId, dfspSchemeIdentifier, primary: false })
        test.end()
      })
    })

    registerTest.test('update activated profile with primary record', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '001'
      let profileId = 'TestProfile'

      let getResponse = {
        code: 200,
        data: {
          profileId
        }
      }

      let existingRecord = { order: 10, preference: 1, service: pathFinderService, regexp: { replace: 'value' } }
      let existingRecord2 = { order: 10, preference: 2, service: pathFinderService, regexp: { replace: 'value2' } }
      let existingProfile = { id: profileId, records: [existingRecord, existingRecord2], addRecord: sandbox.stub(), clearRecords: sandbox.stub() }

      let findResponse = {
        code: 200,
        data: {
          profile: existingProfile
        }
      }

      let newRecord = { order: 10, preference: 0, service: pathFinderService, regexp: { replace: 'other-value' } }
      recordStub.returns(newRecord)

      provisioningClientStub.getProfileForPhoneNumber = sandbox.stub().returns(P.resolve(getResponse))
      provisioningClientStub.findProfile = sandbox.stub().returns(P.resolve(findResponse))
      provisioningClientStub.updateProfile = sandbox.stub().returns(P.resolve())

      PathFinder.registerIdentifier({ identifier, dfspSchemeIdentifier, primary: true }, (err, res) => {
        test.notOk(err)
        test.ok(provisioningClientStub.getProfileForPhoneNumber.calledWith(identifier))
        test.ok(provisioningClientStub.findProfile.calledWith(profileId))
        test.ok(recordStub.calledWith(sandbox.match({
          order: 10,
          preference: 1,
          service: pathFinderService,
          partnerId: pathFinderPartnerId,
          regexp: {
            pattern: pathFinderRegexPattern,
            replace: pathFinderRegexReplace.replace('#{identifier}', `${schemeId}.${dfspSchemeIdentifier}`)
          }
        })))
        test.ok(existingProfile.clearRecords.calledOnce)
        test.ok(existingProfile.addRecord.calledThrice)
        test.ok(existingProfile.addRecord.calledWith(sandbox.match({
          preference: 1,
          regexp: {
            replace: newRecord.regexp.replace
          }
        })))
        test.ok(existingProfile.addRecord.calledWith(sandbox.match({
          preference: 2,
          regexp: {
            replace: existingRecord.regexp.replace
          }
        })))
        test.ok(existingProfile.addRecord.calledWith(sandbox.match({
          preference: 2,
          regexp: {
            replace: existingRecord2.regexp.replace
          }
        })))
        test.ok(provisioningClientStub.updateProfile.calledWith(sandbox.match({ id: profileId })))
        test.ok(Logger.info.calledWith(`Activated profile ${profileId} found, updating with new record`))
        test.ok(Cache.put.calledWith(identifier, existingProfile.records, pathFinderCacheTime))
        test.deepEqual(res, { identifier, schemeIdentifier: schemeId, dfspSchemeIdentifier, primary: true })
        test.end()
      })
    })

    registerTest.test('update activated profile with non-primary record', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '001'
      let profileId = 'TestProfile'

      let getResponse = {
        code: 200,
        data: {
          profileId
        }
      }

      let existingRecord = { order: 10, preference: 1, service: pathFinderService, regexp: { replace: 'value' } }
      let existingRecord2 = { order: 10, preference: 2, service: pathFinderService, regexp: { replace: 'value2' } }
      let existingProfile = { id: profileId, records: [existingRecord, existingRecord2], addRecord: sandbox.stub(), clearRecords: sandbox.stub() }

      let findResponse = {
        code: 200,
        data: {
          profile: existingProfile
        }
      }

      let newRecord = { order: 10, preference: 0, service: pathFinderService, regexp: { replace: 'other-value' } }
      recordStub.returns(newRecord)

      provisioningClientStub.getProfileForPhoneNumber = sandbox.stub().returns(P.resolve(getResponse))
      provisioningClientStub.findProfile = sandbox.stub().returns(P.resolve(findResponse))
      provisioningClientStub.updateProfile = sandbox.stub().returns(P.resolve())

      PathFinder.registerIdentifier({ identifier, dfspSchemeIdentifier, primary: false }, (err, res) => {
        test.notOk(err)
        test.ok(provisioningClientStub.getProfileForPhoneNumber.calledWith(identifier))
        test.ok(provisioningClientStub.findProfile.calledWith(profileId))
        test.ok(recordStub.calledWith(sandbox.match({
          order: 10,
          preference: 1,
          service: pathFinderService,
          partnerId: pathFinderPartnerId,
          regexp: {
            pattern: pathFinderRegexPattern,
            replace: pathFinderRegexReplace.replace('#{identifier}', `${schemeId}.${dfspSchemeIdentifier}`)
          }
        })))
        test.ok(existingProfile.clearRecords.calledOnce)
        test.ok(existingProfile.addRecord.calledThrice)
        test.ok(existingProfile.addRecord.calledWith(sandbox.match({
          preference: 2,
          regexp: {
            replace: newRecord.regexp.replace
          }
        })))
        test.ok(existingProfile.addRecord.calledWith(sandbox.match({
          preference: 1,
          regexp: {
            replace: existingRecord.regexp.replace
          }
        })))
        test.ok(existingProfile.addRecord.calledWith(sandbox.match({
          preference: 2,
          regexp: {
            replace: existingRecord2.regexp.replace
          }
        })))
        test.ok(provisioningClientStub.updateProfile.calledWith(sandbox.match({ id: profileId })))
        test.ok(Logger.info.calledWith(`Activated profile ${profileId} found, updating with new record`))
        test.ok(Cache.put.calledWith(identifier, existingProfile.records, pathFinderCacheTime))
        test.deepEqual(res, { identifier, schemeIdentifier: schemeId, dfspSchemeIdentifier, primary: false })
        test.end()
      })
    })

    registerTest.test('update activated profile with existing record set to primary', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '001'
      let profileId = 'TestProfile'

      let getResponse = {
        code: 200,
        data: {
          profileId
        }
      }

      let regexpReplace = pathFinderRegexReplace.replace('#{identifier}', `${schemeId}.${dfspSchemeIdentifier}`)

      let existingRecord = { order: 10, preference: 1, service: pathFinderService, regexp: { replace: 'value' } }
      let existingRecord2 = { order: 10, preference: 2, service: pathFinderService, regexp: { replace: regexpReplace } }
      let existingProfile = { id: profileId, records: [existingRecord, existingRecord2], clearRecords: sandbox.stub(), addRecord: sandbox.stub() }

      let findResponse = {
        code: 200,
        data: {
          profile: existingProfile
        }
      }

      provisioningClientStub.getProfileForPhoneNumber = sandbox.stub().returns(P.resolve(getResponse))
      provisioningClientStub.findProfile = sandbox.stub().returns(P.resolve(findResponse))
      provisioningClientStub.updateProfile = sandbox.stub().returns(P.resolve())

      PathFinder.registerIdentifier({ identifier, dfspSchemeIdentifier, primary: true }, (err, res) => {
        test.notOk(err)
        test.ok(provisioningClientStub.getProfileForPhoneNumber.calledWith(identifier))
        test.ok(provisioningClientStub.findProfile.calledWith(profileId))
        test.notOk(recordStub.called)
        test.ok(existingProfile.addRecord.calledTwice)
        test.ok(existingProfile.addRecord.calledWith(sandbox.match({
          preference: 1,
          regexp: {
            replace: regexpReplace
          }
        })))
        test.ok(existingProfile.addRecord.calledWith(sandbox.match({
          preference: 2,
          regexp: {
            replace: existingRecord.regexp.replace
          }
        })))
        test.ok(provisioningClientStub.updateProfile.calledWith(sandbox.match({ id: profileId })))
        test.ok(Logger.info.calledWith(`Activated profile ${profileId} found, updating with new record`))
        test.ok(Cache.put.calledWith(identifier, existingProfile.records, pathFinderCacheTime))
        test.deepEqual(res, { identifier, schemeIdentifier: schemeId, dfspSchemeIdentifier, primary: true })
        test.end()
      })
    })

    registerTest.test('not update profile if record already exists and primary status is same', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '001'
      let profileId = 'TestProfile'

      let getResponse = {
        code: 200,
        data: {
          profileId
        }
      }

      let regexpReplace = pathFinderRegexReplace.replace('#{identifier}', `${schemeId}.${dfspSchemeIdentifier}`)

      let existingRecord = { order: 10, preference: 2, service: pathFinderService, regexp: { replace: 'value' } }
      let existingRecord2 = { order: 10, preference: 1, service: pathFinderService, regexp: { replace: regexpReplace } }
      let existingProfile = { id: profileId, records: [existingRecord, existingRecord2], clearRecords: sandbox.stub(), addRecord: sandbox.stub() }

      let findResponse = {
        code: 200,
        data: {
          profile: existingProfile
        }
      }

      provisioningClientStub.getProfileForPhoneNumber = sandbox.stub().returns(P.resolve(getResponse))
      provisioningClientStub.findProfile = sandbox.stub().returns(P.resolve(findResponse))
      provisioningClientStub.updateProfile = sandbox.stub().returns(P.resolve())

      PathFinder.registerIdentifier({ identifier, dfspSchemeIdentifier, primary: true }, (err, res) => {
        test.notOk(err)
        test.ok(provisioningClientStub.getProfileForPhoneNumber.calledWith(identifier))
        test.ok(provisioningClientStub.findProfile.calledWith(profileId))
        test.notOk(recordStub.called)
        test.notOk(existingProfile.addRecord.called)
        test.notOk(provisioningClientStub.updateProfile.called)
        test.ok(Logger.info.calledWith(`Activated profile ${profileId} found, updating with new record`))
        test.ok(Logger.warn.calledWith('Record already exists and is current, no need to update profile'))
        test.notOk(Cache.put.called)
        test.deepEqual(res, { identifier, schemeIdentifier: schemeId, dfspSchemeIdentifier, primary: true })
        test.end()
      })
    })

    registerTest.test('throw error if updating record to non-primary and there is no primary set', test => {
      let identifier = '14441235555'
      let dfspSchemeIdentifier = '001'
      let profileId = 'TestProfile'

      let getResponse = {
        code: 200,
        data: {
          profileId
        }
      }

      let regexpReplace = pathFinderRegexReplace.replace('#{identifier}', `${schemeId}.${dfspSchemeIdentifier}`)

      let existingRecord = { order: 10, preference: 2, service: pathFinderService, regexp: { replace: 'value' } }
      let existingRecord2 = { order: 10, preference: 1, service: pathFinderService, regexp: { replace: regexpReplace } }
      let existingProfile = { id: profileId, records: [existingRecord, existingRecord2], clearRecords: sandbox.stub(), addRecord: sandbox.stub() }

      let findResponse = {
        code: 200,
        data: {
          profile: existingProfile
        }
      }

      provisioningClientStub.getProfileForPhoneNumber = sandbox.stub().returns(P.resolve(getResponse))
      provisioningClientStub.findProfile = sandbox.stub().returns(P.resolve(findResponse))
      provisioningClientStub.updateProfile = sandbox.stub().returns(P.resolve())

      PathFinder.registerIdentifier({ identifier, dfspSchemeIdentifier, primary: false }, (err, res) => {
        test.notOk(res)
        test.notOk(Logger.error.called)
        test.equal(err.name, 'PrimaryError')
        test.equal(err.message, 'There must be a primary DFSP set for the identifier')
        test.end()
      })
    })

    registerTest.end()
  })

  pathfinderTest.end()
})
