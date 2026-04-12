import ApiException from '#exceptions/api_exception'

export default class ResourceNotFoundException extends ApiException {
  constructor(resource: string) {
    super(`${resource} not found`, {
      code: 'RESOURCE_NOT_FOUND',
      status: 404,
      details: { resource },
    })
  }
}
