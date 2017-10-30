'use strict'

const Url = require('url')
const P = require('bluebird')
const Cache = require('memory-cache')
const Logger = require('@mojaloop/central-services-shared').Logger
const Query = require('@mojaloop/pathfinder-query-client')
const Provisioning = require('@mojaloop/pathfinder-provisioning-client')
const NotFoundError = require('@mojaloop/central-services-shared').NotFoundError
const InternalError = require('../../errors/internal-error')
const PrimaryError = require('../../errors/primary-error')
const InvalidIdentifierError = require('../../errors/invalid-identifier-error')
const Config = require('../../lib/config')
const PFConfig = Config.PATHFINDER

const CacheTime = parseInt(PFConfig.CACHE_TIME)
const PrimaryPreference = 1
const NonPrimaryPreference = 2

const queryClient = Query.createClient({ address: PFConfig.QUERY.ADDRESS, port: parseInt(PFConfig.QUERY.PORT), timeout: parseInt(PFConfig.QUERY.TIMEOUT) })
const provisioningClient = Provisioning.createClient({ address: PFConfig.PROVISIONING.ADDRESS })

const dfspResponse = (response, primary = false) => {
  return {
    identifier: response.identifier,
    schemeIdentifier: response.schemeIdentifier,
    dfspSchemeIdentifier: response.dfspSchemeIdentifier,
    primary
  }
}

const isRecordPrimary = (record) => {
  return record.preference === 1
}

const isE164 = (phone) => {
  return /^\+?[1-9]\d{1,14}$/.test(phone)
}

const toDigits = (identifier) => {
  return identifier.replace(/[^\d]/g, '')
}

const validateIdentifier = (identifier) => {
  return new P((resolve, reject) => {
    if (!isE164(identifier)) {
      return reject(new InvalidIdentifierError('The phone number must be in E.164 format'))
    }
    resolve(identifier)
  })
}

const buildRegexp = (dfspIdentifier) => {
  return { pattern: PFConfig.REGEX.PATTERN, replace: PFConfig.REGEX.REPLACE.replace('#{identifier}', dfspIdentifier) }
}

const buildProfileId = (identifier) => {
  const digits = toDigits(identifier)
  return `Profile-${digits}`
}

const buildRecord = (dfspIdentifier) => {
  return Provisioning.Record({ order: 10, preference: 1, service: PFConfig.SERVICE, partnerId: PFConfig.PARTNER_ID, regexp: buildRegexp(dfspIdentifier) })
}

const calculatePreference = (primary) => {
  return primary ? PrimaryPreference : NonPrimaryPreference
}

const mapQueryResponse = (identifier, records) => {
  let mappedRecords = []

  const validRecords = records.filter(r => r.service === PFConfig.SERVICE)
  if (validRecords.length > 0) {
    // Sort valid records by order field, then preference
    validRecords.sort(function (a, b) {
      return a.order - b.order || a.preference - b.preference
    })

    validRecords.forEach(r => {
      const uri = r.regexp.replace

      const parsedUri = Url.parse(uri)
      if (parsedUri.auth && parsedUri.auth.indexOf('.') > -1) {
        let split = parsedUri.auth.split('.')
        mappedRecords.push({ identifier, schemeIdentifier: split[0], dfspSchemeIdentifier: split[1], primary: isRecordPrimary(r) })
      }
    })
  }
  return mappedRecords
}

const createNewProfile = (profileId, dfspIdentifier) => {
  const newRecord = buildRecord(dfspIdentifier)

  const newProfile = Provisioning.Profile({ id: profileId })
  newProfile.addRecord(newRecord)

  return provisioningClient
    .createProfile(newProfile)
    .return({ profile: newProfile, addedRecord: newRecord, updated: true })
}

const updateInactivatedProfile = (inactivatedProfile, dfspIdentifier) => {
  const newRecord = buildRecord(dfspIdentifier)

  inactivatedProfile.clearRecords()
  inactivatedProfile.addRecord(newRecord)

  return provisioningClient
    .updateProfile(inactivatedProfile)
    .return({ profile: inactivatedProfile, addedRecord: newRecord, updated: true })
}

const updatedActivatedProfile = (activatedProfile, dfspIdentifier, primary) => {
  const newRecordPreference = calculatePreference(primary)

  // Get the list of records that match the service we are interested in.
  const validRecords = activatedProfile.records.filter(r => r.service === PFConfig.SERVICE)

  // Build the regexp for the DFSP.
  const regexpForDfsp = buildRegexp(dfspIdentifier)

  // If a record already exists matching this DFSP, make sure it actually needs updated.
  let dfspRecord = validRecords.find(r => r.regexp.replace === regexpForDfsp.replace)
  if (dfspRecord) {
    if (dfspRecord.preference === newRecordPreference) {
      Logger.warn('Record already exists and is current, no need to update profile')
      return { profile: activatedProfile, addedRecord: dfspRecord, updated: false }
    }
  } else {
    dfspRecord = buildRecord(dfspIdentifier)
  }

  const otherRecords = validRecords.filter(r => r !== dfspRecord)
  if (!primary) {
    // If we are setting the current record to not primary, make sure another record is marked primary.
    let currentPrimary = otherRecords.find(r => r.preference === PrimaryPreference)
    if (!currentPrimary) {
      return P.reject(new PrimaryError('There must be a primary DFSP set for the identifier'))
    }
  }

  // Clear out the existing records from the profile.
  activatedProfile.clearRecords()

  // Update the preference for the new record and add it to the profile.
  dfspRecord.preference = newRecordPreference
  activatedProfile.addRecord(dfspRecord)

  // Update the preference for the other records if not primary, then add to profile.
  otherRecords.forEach(r => {
    if (primary) {
      r.preference = NonPrimaryPreference
    }
    activatedProfile.addRecord(r)
  })

  return provisioningClient
    .updateProfile(activatedProfile)
    .return({ profile: activatedProfile, addedRecord: dfspRecord, updated: true })
}

const createOrUpdateProfile = ({ profileId, dfspIdentifier, activated, primary }) => {
  return provisioningClient.findProfile(profileId)
    .then(findResult => {
      const existingProfile = findResult.data.profile
      if (activated) {
        Logger.info(`Activated profile ${profileId} found, updating with new record`)
        return updatedActivatedProfile(existingProfile, dfspIdentifier, primary)
      } else {
        Logger.info(`Inactivated profile ${profileId} found, clearing existing records and adding new record`)
        return updateInactivatedProfile(existingProfile, dfspIdentifier)
      }
    })
    .catch(Provisioning.Errors.NotFoundError, e => {
      Logger.info(`Profile ${profileId} not found, creating new`)
      return createNewProfile(profileId, dfspIdentifier)
    })
}

const handleProvisioningResult = (identifier, result, response) => {
  if (result.updated) {
    cacheProfile(identifier, result.profile)
  }
  return dfspResponse(response, isRecordPrimary(result.addedRecord))
}

const cacheProfile = (identifier, profile) => {
  let cacheId = toDigits(identifier)
  Cache.put(cacheId, profile.records, CacheTime)
}

const queryIdentifier = (identifier) => {
  let cacheId = toDigits(identifier)

  let cached = Cache.get(cacheId)
  if (cached) {
    Logger.info(`Found ${identifier} in cache, returning cached records`)
    return P.resolve({ records: cached })
  }

  Logger.info(`${identifier} not found in cache, querying PathFinder`)
  return queryClient.request(identifier)
}

module.exports = {
  identifierType: 'tel',
  description: 'E.164 phone number',
  find: (identifier, callback) => {
    return validateIdentifier(identifier).then(() => {
      return queryIdentifier(identifier)
        .then(response => {
          const mapped = mapQueryResponse(identifier, response.records)
          if (mapped.length === 0) {
            return P.reject(new NotFoundError('No valid records could be found for the requested phone number'))
          }
          return mapped
        })
        .catch(err => {
          if (err instanceof NotFoundError) {
            throw err
          }

          Logger.error(`Unhandled error returned when querying for ${identifier}`, err)
          throw new InternalError('Unhandled error querying phone number')
        })
    }).asCallback(callback)
  },
  registerIdentifier: ({ identifier, dfspSchemeIdentifier, primary = false }, callback) => {
    return validateIdentifier(identifier).then(() => {
      const schemeIdentifier = Config.SCHEME_ID
      const dfspIdentifier = `${schemeIdentifier}.${dfspSchemeIdentifier}`
      const response = { identifier, schemeIdentifier, dfspSchemeIdentifier }

      return provisioningClient.getProfileForPhoneNumber(identifier)
        .then(getResult => {
          return createOrUpdateProfile({ profileId: getResult.data.profileId, dfspIdentifier, activated: true, primary })
            .then(result => handleProvisioningResult(identifier, result, response))
        })
        .catch(Provisioning.Errors.NotFoundError, e => {
          Logger.info(`No activated profile found for ${identifier}`)

          const profileId = buildProfileId(identifier)
          return createOrUpdateProfile({ profileId, dfspIdentifier, activated: false, primary })
            .then(result => {
              Logger.info(`Activating profile ${profileId} for phone number ${identifier}`)
              return provisioningClient.activatePhoneNumber(identifier, profileId)
                .then(() => handleProvisioningResult(identifier, result, response))
            })
        })
        .catch(err => {
          if (err instanceof PrimaryError) {
            throw err
          }

          Logger.error(`Unhandled error when registering phone number ${identifier}`, err)
          throw new InternalError('Unhandled error registering phone number')
        })
    }).asCallback(callback)
  }
}
