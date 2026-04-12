import type Comment from '#models/comment'
import { toUserDto, type UserDto } from '#dtos/user'

export type CommentDto = {
  id: number
  postId: number
  userId: number
  body: string
  author?: UserDto
  createdAt: string | null
  updatedAt: string | null
}

export function toCommentDto(comment: Comment): CommentDto {
  return {
    id: comment.id,
    postId: comment.postId,
    userId: comment.userId,
    body: comment.body,
    author: comment.author ? toUserDto(comment.author) : undefined,
    createdAt: comment.createdAt?.toISO() ?? null,
    updatedAt: comment.updatedAt?.toISO() ?? null,
  }
}
