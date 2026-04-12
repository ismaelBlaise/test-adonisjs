import Post from '#models/post'
import Comment from '#models/comment'
import { createCommentValidator, updateCommentValidator } from '#validators/comment'
import type { HttpContext } from '@adonisjs/core/http'

export default class CommentsController {
  async index({ params, response }: HttpContext) {
    const post = await Post.find(params.post_id)

    if (!post) {
      return response.notFound({ message: 'Post not found' })
    }

    return Comment.query().where('post_id', post.id).preload('author').orderBy('created_at', 'asc')
  }

  async store({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const post = await Post.find(params.post_id)

    if (!post) {
      return response.notFound({ message: 'Post not found' })
    }

    const payload = await request.validateUsing(createCommentValidator)
    const comment = await Comment.create({
      postId: post.id,
      userId: user.id,
      body: payload.body,
    })

    await comment.load('author')

    return response.created(comment)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const comment = await Comment.find(params.id)

    if (!comment) {
      return response.notFound({ message: 'Comment not found' })
    }

    if (comment.userId !== user.id) {
      return response.forbidden({ message: 'Only the author can update this comment' })
    }

    const payload = await request.validateUsing(updateCommentValidator)
    comment.body = payload.body
    await comment.save()
    await comment.load('author')

    return comment
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const comment = await Comment.query().where('id', params.id).preload('post').first()

    if (!comment) {
      return response.notFound({ message: 'Comment not found' })
    }

    const isCommentAuthor = comment.userId === user.id
    const isPostAuthor = comment.post.userId === user.id

    if (!isCommentAuthor && !isPostAuthor) {
      return response.forbidden({ message: 'Only the comment author or post author can delete it' })
    }

    await comment.delete()

    return response.noContent()
  }
}
