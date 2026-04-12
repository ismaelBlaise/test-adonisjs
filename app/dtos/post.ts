import type Post from '#models/post'
import type PostImage from '#models/post_image'
import { toCommentDto, type CommentDto } from '#dtos/comment'
import { toUserDto, type UserDto } from '#dtos/user'

export type PostImageDto = {
  id: number
  postId: number
  url: string
  altText: string | null
  sortOrder: number
}

export type PostDto = {
  id: number
  userId: number
  title: string
  slug: string
  excerpt: string | null
  coverImageUrl: string | null
  body: string
  isPublished: boolean
  viewsCount: number
  likesCount: number
  commentsCount: number
  author?: UserDto
  images: PostImageDto[]
  comments?: CommentDto[]
  publishedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

function toPostImageDto(image: PostImage): PostImageDto {
  return {
    id: image.id,
    postId: image.postId,
    url: image.url,
    altText: image.altText,
    sortOrder: image.sortOrder,
  }
}

export function toPostDto(post: Post): PostDto {
  return {
    id: post.id,
    userId: post.userId,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImageUrl: post.coverImageUrl,
    body: post.body,
    isPublished: post.isPublished,
    viewsCount: post.viewsCount,
    likesCount: post.likesCount,
    commentsCount: Number(post.$extras.comments_count ?? post.comments?.length ?? 0),
    author: post.author ? toUserDto(post.author) : undefined,
    images: post.images?.map(toPostImageDto) ?? [],
    comments: post.comments?.map(toCommentDto),
    publishedAt: post.publishedAt?.toISO() ?? null,
    createdAt: post.createdAt?.toISO() ?? null,
    updatedAt: post.updatedAt?.toISO() ?? null,
  }
}
