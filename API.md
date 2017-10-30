# Central Directory API 
***

In this guide, we'll walk through the different central directory endpoints:
* `POST` [**Register a DFSP**](#register-a-dfsp)
* `GET` [**Get identifier types**](#get-identifier-types) 
* `POST` [**Register an identifier**](#register-an-identifier)
* `GET` [**Lookup resource by identifier**](#lookup-resource-by-identifier)
* `GET` [**Get directory metadata**](#get-directory-metadata)
* `GET` [**Get authentication token**](#get-authentication-token)
* `GET` [**Directory health check**](#directory-health)

The different endpoints often deal with these [data structures:](#data-structures) 
* [**Resource Object**](#resource-object)
* [**DFSP Object**](#dfsp-object)
* [**Identifier Type Object**](#identifier-type-object)
* [**Metadata Object**](#metadata-object)

Information about various errors returned can be found here:
* [**Error Information**](#error-information)

***

## Endpoints

### **Register a DFSP**
This endpoint allows a DFSP to be registered to use the central directory.

#### HTTP Request
```POST http://central-directory/commands/register```

#### Authentication
| Type | Description |
| ---- | ----------- |
| HTTP Basic | The username and password are the values of environment variables CDIR\_ADMIN_KEY and CDIR\_ADMIN_SECRET. This is the same if Basic authentication or Token authentication are enabled. |

#### Headers
| Field | Type | Description |
| ----- | ---- | ----------- |
| Content-Type | String | Must be set to `application/json` |

#### Request body
| Field | Type | Description |
| ----- | ---- | ----------- |
| name | String | The name of the created DFSP |
| shortName | String | The shortName of the created DFSP |
| providerUrl | String | The url reference for the DFSP |

#### Response 201 Created
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | DFSP | The [DFSP object](#dfsp-object) as saved |

#### Request
``` http
POST http://central-directory/commands/register HTTP/1.1
Content-Type: application/json
{
  "name": "The first DFSP",
  "shortName": "dfsp1",
  "providerUrl": "http://url.com"
}
```

#### Response
``` http
HTTP/1.1 201 CREATED
Content-Type: application/json
{
  "name": "The first DFSP",
  "shortName": "dfsp1",
  "providerUrl": "http://url.com",
  "key": "dfsp_key",
  "secret": "dfsp_secret"
}
```

#### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| AlreadyExistsError | The DFSP already exists (determined by name) |
``` http
{
  "id": "AlreadyExistsError",
  "message": "The DFSP already exists (determined by name)"
}
```

### **Get identifier types**
This endpoint allows retrieval of the identifier types supported by the central directory.

#### HTTP Request
```GET http://central-directory/identifier-types```

#### Authentication
| Type | Description |
| ---- | ----------- |
| HTTP Basic | The username and password are the key and secret of a registered DFSP, ex dfsp1:dfsp1. |
| HTTP Bearer | If Token authentication enabled, the token must be passed in the Authorization header, as well as the name of the registered DFSP in the Directory-Api-Key header. |

#### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Array | List of supported [Identifier Type objects](#identifier-type-object) |


#### Request
```http
GET http://central-directory/identifier-types HTTP/1.1
```

#### Response
``` http
HTTP/1.1 200 OK
[
  {
    "identifierType": "eur",
    "description": "Central end user registry"
  }
]
```

### **Register an identifier**
This endpoint allows a DFSP to add an identifier associated with their account. When the identifier is retrieved from the [**Lookup resource by identifier**](#lookup-resource-by-identifier) endpoint, the url registered with the DFSP will be returned.

#### HTTP Request
```POST http://central-directory/resources```

#### Authentication
| Type | Description |
| ---- | ----------- |
| HTTP Basic | The username and password are the key and secret of a registered DFSP, ex dfsp1:dfsp1. |
| HTTP Bearer | If Token authentication enabled, the token must be passed in the Authorization header, as well as the name of the registered DFSP in the Directory-Api-Key header. |

#### Headers
| Field | Type | Description |
| ----- | ---- | ----------- |
| Content-Type | String | Must be set to `application/json` |

#### Request body
| Field | Type | Description |
| ----- | ---- | ----------- |
| identifier | String | The identifier type and identifier to be created, separated by a colon |
| primary | String | *(optional)* Sets the DFSP as primary for the identifier, can either be *true* or *false*. |

***Primary will default to true if it is the first DFSP added for this identifier, and will default to false if another DFSP already has been added.***

***If the current DFSP being updated is primary and the primary value is set to false, an error will be thrown.***

#### Response 201 Created
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Resource | The newly-created [Resource object](#resource-object) as saved |

#### Request
``` http
POST http://central-directory/resources HTTP/1.1
Content-Type: application/json
{
  "identifier": "eur:dfsp123",
  "primary": "true"
}
```

#### Response 
``` http
HTTP/1.1 201 CREATED
Content-Type: application/json
{
  "name": "The First DFSP",
  "providerUrl": "http://dfsp/users/1",
  "shortName": "dsfp1",
  "primary": "true",
  "registered": "true"
}
```

#### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| AlreadyExistsError | The identifier has already been registered by this DFSP |
``` http
{
  "id": "AlreadyExistsError",
  "message": "The identifier has already been registered by this DFSP"
}
```

### **Lookup resource by identifier**
This endpoint allows retrieval of a URI that will return customer information by supplying an identifier and identifier type.

#### HTTP Request
```GET http://central-directory/resources?identifier={identifierType:identifier}```

#### Authentication
| Type | Description |
| ---- | ----------- |
| HTTP Basic | The username and password are the key and secret of a registered DFSP, ex dfsp1:dfsp1. |
| HTTP Bearer | If Token authentication enabled, the token must be passed in the Authorization header, as well as the name of the registered DFSP in the Directory-Api-Key header. |

#### Query Params
| Field | Type | Description |
| ----- | ---- | ----------- |
| identifier | String | Valid identifier type and identifier separated with a colon |

#### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Object | Array | An array of [Resource objects](#resource-object) retrieved |

***The returned array will contain one DFSP with primary set to true. All others should be set to false.***

#### Request
```http
GET http://central-directory/resources?identifier=eur:1234 HTTP/1.1
```

#### Response
``` http
HTTP/1.1 200 OK
[
  {
    "name": "The First DFSP",
    "providerUrl": "http://dfsp/users/1",
    "shortName": "dsfp1",
    "primary": "true",
    "registered": "true"
  },
  {
    "name": "The Second DFSP",
    "providerUrl": "http://dfsp/users/2",
    "shortName": "dsfp2",
    "primary": "false",
    "registered": "false"
  }
]
```

#### Errors (4xx)
| Field | Description |
| ----- | ----------- |
| NotFoundError | The requested resource could not be found. |
``` http
{
  "id": "NotFoundError",
  "message": "The requested resource could not be found."
}
```

### **Get directory metadata**
Returns metadata associated with the directory

#### HTTP Request
```GET http://central-directory```

#### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| Metadata | Object | The [Metadata object](#metadata-object) for the directory |

#### Request
``` http
GET http://central-directory HTTP/1.1
```

#### Response
``` http
HTTP/1.1 200 OK
{
  "directory": "http://central-directory",
  "urls": {
    "health": "http://central-directory/health",
    "identifier_types": "http://central-directory/identifier-types",
    "resources": "http://central-directory/resources",
    "register_identifier": "http://central-directory/resources"
  }
}
```

#### Get authentication token
The get authentication endpoint generates an authentication token

##### HTTP Request
`GET http://central-directory/auth_token`

#### Authentication
| Type | Description |
| ---- | ----------- |
| HTTP Basic | The username and password are the key and secret of a registered DFSP, ex dfsp1:dfsp1. |

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| token | String | The generated authentication token |

##### Request
``` http
GET http://central-directory/auth_token HTTP/1.1
```

##### Response
``` http
HTTP/1.1 200 OK
{
  "token": "1234token4321"
}
```

#### **Directory Health**
Get the current status of the service

##### HTTP Request
`GET http://central-directory/health`

##### Response 200 OK
| Field | Type | Description |
| ----- | ---- | ----------- |
| status | String | The status of the directory, *OK* if the service is working |

##### Request
``` http
GET http://central-directory/health HTTP/1.1
```

##### Response
``` http
HTTP/1.1 200 OK
{
  "status": "OK"
}
```

***

## Data Structures

### Resource Object

A resource represents the information returned about an identifier and identifier type.

A resource object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | String | Name of the DFSP |
| providerUrl | URI | A URI that can be called to get more information about the customer |
| shortName | String | Shortened name for the DFSP |
| primary | String | Details if the DFSP is set as primary, can either be *true* or *false* |
| registered | String | Returns *true* if DFSP is registered for the identifier, *false* if defaulted |

### DFSP Object

Represents a DFSP that has registered with the central directory.

Some fields are Read-only, meaning they are set by the API and cannot be modified by clients. A DFSP object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | String | The name of the created DFSP |
| shortName | String | The shortName of the created DFSP |
| providerUrl | String | The URL for the DFSP |
| key | String | Key used to authenticate with protected endpoints. Becomes the username for Basic Auth. Currently the same value as the name field |
| secret | String | Secret used to authenticate with protected endpoints. Currently the same value as the name field |

### Identifier Type Object

Represents an identifier type that is supported by the central directory.

An identifier type object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| identifierType | String | Unique name of the identifier type |
| description | String | Description of the identifier type |

### Metadata Object

The central directory will return a metadata object about itself allowing client's to configure themselves properly.

A metadata object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| directory | URI | The directory that generated the metadata |
| urls | Object | Paths to other methods exposed by this directory. Each field name is short name for a method and the value is the path to that method. |


***

## Error information

This section identifies the potential errors returned and the structure of the response.

An error object can have the following fields:

| Name | Type | Description |
| ---- | ---- | ----------- |
| id | String | An identifier for the type of error |
| message | String | A message describing the error that occurred |
| validationErrors | Array | *Optional* An array of validation errors |
| validationErrors[].message | String | A message describing the validation error |
| validationErrors[].params | Object | An object containing the field that caused the validation error |
| validationErrors[].params.key | String | The name of the field that caused the validation error |
| validationErrors[].params.value | String | The value that caused the validation error |
| validationErrors[].params.child | String | The name of the child field |

``` http
HTTP/1.1 404 Not Found
Content-Type: application/json
{
  "id": "InvalidQueryParameterError",
  "message": "Error validating one or more query parameters",
  "validationErrors": [
    {
      "message": "'0' is not a registered identifierType",
      "params": {
        "key": "identifierType",
        "value": "0"
      }
    }
  ]
}
```
