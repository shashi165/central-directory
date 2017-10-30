'use strict'

const Shared = require('@mojaloop/central-services-shared')
const BaseError = Shared.BaseError
const Category = Shared.ErrorCategory

const AlreadyExistsError = class extends BaseError {
  constructor (message) {
    super(Category.UNPROCESSABLE, message)
  }
}

module.exports = AlreadyExistsError
