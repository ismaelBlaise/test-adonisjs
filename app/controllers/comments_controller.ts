import CommentsService from '#services/comments_service'
import { ok } from '#http/responses'
import { createCommentValidator, updateCommentValidator } from '#validators/comment'
import type { HttpContext } from '@adonisjs/core/http'

export default class CommentsController {
  private commentsService = new CommentsService()

  async index({ params }: HttpContext) {
    return ok(await this.commentsService.listForPost(params.post_id))
  }

  async store({ auth, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(createCommentValidator)
    const comment = await this.commentsService.create(auth.getUserOrFail(), params.post_id, payload)

    return response.created(ok(comment))
  }

  async update({ auth, params, request }: HttpContext) {
    const payload = await request.validateUsing(updateCommentValidator)

    return ok(await this.commentsService.update(auth.getUserOrFail(), params.id, payload))
  }

  async destroy({ auth, params, response }: HttpContext) {
    await this.commentsService.delete(auth.getUserOrFail(), params.id)
    return response.noContent()
  }
}
