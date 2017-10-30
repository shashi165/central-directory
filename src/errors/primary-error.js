'use strict'

const Shared = require('@mojaloop/central-services-shared')
const BaseError = Shared.BaseError
const Category = Shared.ErrorCategory

class PrimaryError extends BaseError {
  constructor (message) {
    super(Category.BAD_REQUEST, message)
  }
}

module.exports = PrimaryError
