# User Retrieval Guide
***

## Introduction
In this guide, we'll walk through the different steps of successfully retrieving a user from the Central Directory.
* [**Registering a user with the Central End User Registry**](#step-1-register-a-user-with-the-central-end-user-registry)
* [**Registering a DFSP with the Central Directory**](#step-2-register-a-dfsp-with-the-central-directory) 
* [**Looking up a user in the Central Directory**](#step-3-look-up-a-user-in-the-central-directory)
* [**Next Steps**](#next-steps)

***

## Step 1: Register a user with the Central End User Registry
Start off by registering a user with the url **http://dfsp1.com**. Simply provide the user's url and make a call to the register user endpoint. More detail about the response and errors can be found in the [Central End User Registry API documentation.](https://github.com/@mojaloop/central-end-user-registry/blob/master/central-end-user-registry-documentation.md)


#### Request
```
POST http://central-end-user-registry/users
Content-Type: application/json
{
  "url": "http://user.dfsp.com"
}
```

#### Response
```
HTTP/1.1 201 Created
{
  "url": "http://user.dfsp.com",
  "number": "17141140"
}
```

## Step 2: Register a DFSP with the Central Directory
Once you have registered a user in the Central End User Registry, you need to register a DFSP with the Central Directory. This DFSP will simply be called **dfsp1**. A more in depth explanation can be found in the [API documentation.](API.md)


#### Authorization 
To register a DFSP with the directory, you need to authorize the call using [HTTP basic auth](https://tools.ietf.org/html/rfc2617#section-2) with an admin key and secret. 

Key | Secret
------------ | -------------
admin | admin 

#### Request
```
POST http://central-directory/commands/register HTTP/1.1
Content-Type: application/json
Authorization: Basic YWRtaW46YWRtaW4= 
{
  "name": "The first DFSP",
  "shortName": "dfsp1",
  "providerUrl": "http://url.com"
}
```

#### Response
```
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

## Step 3: Look up a user in the Central Directory
Now that you have created a user and registered a new DFSP, you can proceed with looking up the user in the Central Directory. Like before, more information can be found in the [API documentation.](API.md) 


#### Authorization 
To retrieve the user from the directory, you need to authorize the call using [HTTP basic auth](https://tools.ietf.org/html/rfc2617#section-2) with the key and secret returned from the register DFSP command above. 

Key | Secret
------------ | -------------
dfsp1 | dfsp1 

#### Request
```
http://central-directory/resources/?identifierType=eur:17141140 HTTP/1.1
Authorization: Basic ZGZzcDE6ZGZzcDE=
```

#### Response
```
HTTP/1.1 200 OK
[
  {
    "name": "The First DFSP",
    "providerUrl": "http://dfsp/users/1",
    "shortName": "dsfp1",
    "primary": "true",
    "registered": "true"
  }
]
```

## Next Steps
Now that you have succesfully created a DSFP and looked up a user, you should feel comfortable working with the other endpoints found in the [Central End User Registry API documentation](https://github.com/@mojaloop/central-end-user-registry/blob/master/central-end-user-registry-documentation.md) and the
[Central Directory API documentation.](API.md)
