import Comment from '#models/comment'
import Post from '#models/post'
import ForbiddenActionException from '#exceptions/forbidden_action_exception'
import ResourceNotFoundException from '#exceptions/resource_not_found_exception'
import { toCommentDto, type CommentDto } from '#dtos/comment'
import type User from '#models/user'
import type { CreateCommentDto, UpdateCommentDto } from '#validators/comment'

export default class CommentsService {
  async listForPost(postId: number | string): Promise<CommentDto[]> {
    const post = await Post.find(postId)

    if (!post) {
      throw new ResourceNotFoundException('Post')
    }

    const comments = await Comment.query()
      .where('post_id', post.id)
      .preload('author')
      .orderBy('created_at', 'asc')

    return comments.map(toCommentDto)
  }

  async create(
    user: User,
    postId: number | string,
    payload: CreateCommentDto
  ): Promise<CommentDto> {
    const post = await Post.find(postId)

    if (!post) {
      throw new ResourceNotFoundException('Post')
    }

    const comment = await Comment.create({
      postId: post.id,
      userId: user.id,
      body: payload.body,
    })

    await comment.load('author')

    return toCommentDto(comment)
  }

  async update(user: User, id: number | string, payload: UpdateCommentDto): Promise<CommentDto> {
    const comment = await this.findModel(id)

    if (comment.userId !== user.id) {
      throw new ForbiddenActionException('Only the author can update this comment')
    }

    comment.body = payload.body
    await comment.save()
    await comment.load('author')

    return toCommentDto(comment)
  }

  async delete(user: User, id: number | string) {
    const comment = await Comment.query().where('id', id).preload('post').first()

    if (!comment) {
      throw new ResourceNotFoundException('Comment')
    }

    const isCommentAuthor = comment.userId === user.id
    const isPostAuthor = comment.post.userId === user.id

    if (!isCommentAuthor && !isPostAuthor) {
      throw new ForbiddenActionException('Only the comment author or post author can delete it')
    }

    await comment.delete()
  }

  private async findModel(id: number | string) {
    const comment = await Comment.find(id)

    if (!comment) {
      throw new ResourceNotFoundException('Comment')
    }

    return comment
  }
}
