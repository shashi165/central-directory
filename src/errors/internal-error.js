'use strict'

const Shared = require('@mojaloop/central-services-shared')
const BaseError = Shared.BaseError
const Category = Shared.ErrorCategory

const InternalError = class extends BaseError {
  constructor (message) {
    super(Category.INTERNAL, message)
  }
}

module.exports = InternalError
