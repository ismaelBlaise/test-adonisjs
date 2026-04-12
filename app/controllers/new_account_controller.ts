import User from '#models/user'
import { ok } from '#http/responses'
import { signupValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { toUserDto } from '#dtos/user'

export default class NewAccountController {
  async store({ request, response }: HttpContext) {
    const { fullName, email, password } = await request.validateUsing(signupValidator)

    const user = await User.create({ fullName, email, password })
    const token = await User.accessTokens.create(user)

    return response.created(
      ok({
        user: toUserDto(user),
        token: token.value!.release(),
      })
    )
  }
}
