import { Exception } from '@adonisjs/core/exceptions'

export type ApiExceptionOptions = {
  code: string
  status: number
  details?: unknown
}

export default class ApiException extends Exception {
  declare code: string
  declare details?: unknown

  constructor(message: string, options: ApiExceptionOptions) {
    super(message, {
      code: options.code,
      status: options.status,
    })

    this.details = options.details
  }
}
