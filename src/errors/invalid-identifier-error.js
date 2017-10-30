'use strict'

const Shared = require('@mojaloop/central-services-shared')
const BaseError = Shared.BaseError
const Category = Shared.ErrorCategory

class InvalidIdentifierError extends BaseError {
  constructor (message) {
    super(Category.BAD_REQUEST, message)
  }
}

module.exports = InvalidIdentifierError
