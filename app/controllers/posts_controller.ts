import PostsService from '#services/posts_service'
import { ok, paginated } from '#http/responses'
import { createPostValidator, listPostsValidator, updatePostValidator } from '#validators/post'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  private postsService = new PostsService()

  async index({ request }: HttpContext) {
    const filters = await request.validateUsing(listPostsValidator)
    const posts = await this.postsService.list(filters)

    return paginated(posts.data, posts.pagination)
  }

  async show({ params }: HttpContext) {
    return ok(await this.postsService.get(params.id))
  }

  async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(createPostValidator)
    const post = await this.postsService.create(auth.getUserOrFail(), payload)

    return response.created(ok(post))
  }

  async update({ auth, params, request }: HttpContext) {
    const payload = await request.validateUsing(updatePostValidator)

    return ok(await this.postsService.update(auth.getUserOrFail(), params.id, payload))
  }

  async destroy({ auth, params, response }: HttpContext) {
    await this.postsService.delete(auth.getUserOrFail(), params.id)
    return response.noContent()
  }

  async recordView({ params }: HttpContext) {
    return ok(await this.postsService.recordView(params.id))
  }

  async like({ auth, params }: HttpContext) {
    return ok(await this.postsService.like(auth.getUserOrFail(), params.id))
  }

  async unlike({ auth, params }: HttpContext) {
    return ok(await this.postsService.unlike(auth.getUserOrFail(), params.id))
  }
}
