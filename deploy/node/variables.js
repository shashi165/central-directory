const environment = process.env.ENVIRONMENT || 'TEST'

module.exports = {
  AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID || 886403637725,
  APP_NAME: process.env.APP_NAME || 'central-directory',
  AWS_REGION: process.env.AWS_REGION || 'us-west-2',
  ENVIRONMENT: environment,
  VERSION: process.env.CIRCLE_TAG || process.env.CIRCLE_BRANCH + '-' + process.env.CIRCLE_BUILD_NUM,
  API: {
    NAME: 'central-directory',
    IMAGE: process.env.API_IMAGE || 'mojaloop/central-directory',
    PORT: process.env.API_PORT || 3000
  },
  CLUSTER: process.env.CLUSTER || 'central-services-' + environment,
  DOCKER_EMAIL: process.env.DOCKER_EMAIL,
  DOCKER_USER: process.env.DOCKER_USER,
  DOCKER_PASS: process.env.DOCKER_PASS,
  HOSTNAME: process.env.HOSTNAME || 'http://central-directory-TEST-2067903239.us-west-2.elb.amazonaws.com',
  JFROG_REPO: process.env.JFROG_REPO || 'modusbox-level1-docker-release.jfrog.io',
  POSTGRES_USER: process.env.DEV_POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.DEV_POSTGRES_PASSWORD,
  POSTGRES_HOST: process.env.DEV_POSTGRES_HOST,
  END_USER_REGISTRY: process.env.END_USER_REGISTRY || 'http://central-end-user-registry-TEST-1765383584.us-west-2.elb.amazonaws.com',
  DEFAULT_DFSP: process.env.DEFAULT_DFSP || 'dfsp1'
}
