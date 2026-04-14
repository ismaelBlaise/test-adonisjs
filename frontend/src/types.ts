export type ApiEnvelope<T> = {
  data: T
  meta?: Record<string, unknown>
}

export type ApiErrorEnvelope = {
  error: {
    code: string
    message: string
    status: number
    path?: string
    method?: string
    timestamp?: string
    details?: unknown
  }
}

export type UserDto = {
  id: number
  fullName: string | null
  email: string
  initials: string
  createdAt: string | null
  updatedAt: string | null
}

export type PostImageDto = {
  id: number
  postId: number
  url: string
  altText: string | null
  sortOrder: number
}

export type CommentDto = {
  id: number
  postId: number
  userId: number
  body: string
  author?: UserDto
  createdAt: string | null
  updatedAt: string | null
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

export type AuthPayload = {
  user: UserDto
  token: string
}

export type CreatePostPayload = {
  title: string
  excerpt?: string | null
  coverImageUrl?: string | null
  body: string
  isPublished?: boolean
  images?: Array<{
    url: string
    altText?: string | null
    sortOrder?: number
  }>
}
