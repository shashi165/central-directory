'use strict'

const Aws = require('./aws')
const Ecr = require('./ecr')
const Ecs = require('./ecs')
const Jfrog = require('./jfrog')
const Variables = require('./variables')

const pushService = ({ IMAGE, NAME, PORT }, version) => {
  const databaseUri = `postgres://${Variables.POSTGRES_USER}:${Variables.POSTGRES_PASSWORD}@${Variables.POSTGRES_HOST}:5432/central_directory`
  const envVariables = [
    {
      name: 'CDIR_DATABASE_URI',
      value: databaseUri
    },
    {
      name: 'CDIR_HOSTNAME',
      value: Variables.HOSTNAME
    },
    {
      name: 'CDIR_END_USER_REGISTRY_URL',
      value: Variables.END_USER_REGISTRY
    },
    {
      name: 'CDIR_DEFAULT_DFSP',
      value: 'The second DFSP'
    },
    {
      name: 'CDIR_PATHFINDER__PROVISIONING__ADDRESS',
      value: 'https://pathfinder-cte-pi.neustar.biz/nrs-pi/services/SIPIX/SendRequest'
    },
    {
      name: 'CDIR_PATHFINDER__QUERY__ADDRESS',
      value: '10.10.12.227'
    },
    {
      name: 'CDIR_PATHFINDER__QUERY__PORT',
      value: '9000'
    }
  ]
  const serviceName = `${NAME}-${Variables.ENVIRONMENT}`
  return Ecr.pushImageToEcr(IMAGE, version)
    .then(result => Ecs.registerTaskDefinition(serviceName, result.versioned, PORT, envVariables))
    .then(taskDefinition => Ecs.deployService(Variables.CLUSTER, serviceName, taskDefinition))
}

const deploy = () => {
  const version = Variables.VERSION
  Aws.configureAws()
    .then(() => pushService(Variables.API, version))
    .then(() => Jfrog.login())
    .then(() => Jfrog.pushImageToJFrog(Variables.API.IMAGE, version))
    .catch(e => {
      console.error(e)
      process.exit(1)
    })
}

module.exports = deploy()
