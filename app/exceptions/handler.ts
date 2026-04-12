import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

type ApiErrorPayload = {
  error: {
    code: string
    message: string
    status: number
    details?: unknown
  }
}

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    const httpError = this.toHttpError(error)
    const details = 'details' in httpError ? httpError.details : undefined

    if (httpError.code === 'E_VALIDATION_ERROR' && 'messages' in httpError) {
      return ctx.response.status(422).send(
        this.toPayload({
          code: 'VALIDATION_ERROR',
          message: 'The request payload is invalid',
          status: 422,
          details: httpError.messages,
        })
      )
    }

    return ctx.response.status(httpError.status).send(
      this.toPayload({
        code: this.normalizeCode(httpError.code),
        message: this.safeMessage(httpError.message, httpError.status),
        status: httpError.status,
        details,
      })
    )
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }

  private toPayload(error: ApiErrorPayload['error']): ApiErrorPayload {
    return {
      error: {
        code: error.code,
        message: error.message,
        status: error.status,
        ...(error.details ? { details: error.details } : {}),
      },
    }
  }

  private normalizeCode(code?: string) {
    if (!code) {
      return 'HTTP_ERROR'
    }

    return code.replace(/^E_/, '').replaceAll('_', '-').toUpperCase().replaceAll('-', '_')
  }

  private safeMessage(message: string, status: number) {
    if (app.inProduction && status >= 500) {
      return 'Internal server error'
    }

    return message
  }
}
