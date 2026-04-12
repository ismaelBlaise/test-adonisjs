import { ok } from '#http/responses'
import { toUserDto } from '#dtos/user'
import type { HttpContext } from '@adonisjs/core/http'

export default class ProfileController {
  async show({ auth }: HttpContext) {
    return ok(toUserDto(auth.getUserOrFail()))
  }
}
