import User from '#models/user'
import { ok, message } from '#http/responses'
import { loginValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { toUserDto } from '#dtos/user'

export default class AccessTokenController {
  async store({ request }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)
    const token = await User.accessTokens.create(user)

    return ok({
      user: toUserDto(user),
      token: token.value!.release(),
    })
  }

  async destroy({ auth }: HttpContext) {
    const user = auth.getUserOrFail()
    if (user.currentAccessToken) {
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
    }

    return message('Logged out successfully')
  }
}
