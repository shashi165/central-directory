# central-directory

The central directory is a series of services that allows DFSPs to register and retrieve scheme identifiers. The scheme identifier can be leveraged by DFSPs for end-user discovery. 

The following documentation represents the services, APIs and endpoints responsible for registering a DFSP, adding an end user, and retrieving an end user.

Contents:

- [Deployment](#deployment)
- [Configuration](#configuration)
- [API](#api)
- [Authentication](#authentication)
- [Logging](#logging)
- [Tests](#tests)

## Deployment

See the [Onboarding guide](Onboarding.md) for running the service locally.

## Configuration

### Environment variables
The central directory has many options that can be configured through environment variables.

| Environment variable | Description | Example values |
| -------------------- | ----------- | ------ |
| CDIR\_DATABASE_URI   | The connection string for the database the central directory will use. Postgres is currently the only supported database. | postgres://\<username>:\<password>@localhost:5432/central_directory |
| CDIR\_PORT | The port the API server will run on. | 3000 |
| CDIR\_HOSTNAME | The URI that will be used to create and validate links to resources on the central directory.  | http://central-directory |
| CDIR\_END\_USER\_REGISTRY_URL | The URI to the end user registry service the central directory should connect to. | http://end-user-registry |
| CDIR\_SCHEME_ID | The 3-character ID assigned to the scheme the central directory instance will be a part of. | 001 |
| CDIR\_ADMIN_KEY | Key used for admin access to endpoints that require validation. | AdminKey |
| CDIR\_ADMIN_SECRET | Secret used for admin access to endpoints that require validation. | AdminSecret |
| CDIR\_ENABLE\_TOKEN_AUTH | Flag to enable token protection on endpoints that require authorization. To create a token, reference the [API documentation](API.md). | false |
| CDIR\_TOKEN_EXPIRATION | Time in milliseconds for API tokens to expire. Only used if CDIR\_ENABLE\_TOKEN\_AUTH set to "true". | 3600000 |

## API

For endpoint documentation, see the [API documentation](API.md).

For help storing and retrieving user information, see the [User Retrieval Guide](UserRetrievalGuide.md)

## Authentication

The central directory offers two forms of authentication currently. Basic authentication is enabled by default. This will protect endpoints with HTTP Basic authentication, where the the username and password will be the key and secret of the DFSP making the request. 

Token authentication is also offered by the central directory. The /auth_token endpoint will still be protected by Basic authentication as above, but will return a token back that is valid for the authenticated DFSP. The other endpoints will then be authenticated to by passing the token in the Authorization HTTP header as a Bearer token. You must also pass in the name of the DFSP the token is valid for in the Directory-Api-Key HTTP header.

```
Authorization: Bearer token1234abc
Directory-Api-Key: dfsp1
```

To view the endpoints requiring authentication, please review the [API guide](API.md).

## Logging

Logs are sent to standard output by default.

## Tests

Tests include unit, functional, and integration. 

Running the tests:


    npm run test:all


Tests include code coverage via istanbul. See the test/ folder for testing scripts.
