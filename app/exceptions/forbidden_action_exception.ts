import ApiException from '#exceptions/api_exception'

export default class ForbiddenActionException extends ApiException {
  constructor(message = 'You are not allowed to perform this action') {
    super(message, {
      code: 'FORBIDDEN_ACTION',
      status: 403,
    })
  }
}
