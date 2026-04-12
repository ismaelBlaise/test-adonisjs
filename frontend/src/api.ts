import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  AuthPayload,
  CommentDto,
  CreatePostPayload,
  PostDto,
  UserDto,
} from './types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api/v1'

export class ApiError extends Error {
  code: string
  status: number
  details?: unknown

  constructor(payload: ApiErrorEnvelope['error']) {
    super(payload.message)
    this.code = payload.code
    this.status = payload.status
    this.details = payload.details
  }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = (await response.json()) as ApiEnvelope<T> | ApiErrorEnvelope

  if (!response.ok) {
    throw new ApiError((payload as ApiErrorEnvelope).error)
  }

  return (payload as ApiEnvelope<T>).data
}

export const api = {
  signup(payload: {
    fullName: string
    email: string
    password: string
    passwordConfirmation: string
  }) {
    return request<AuthPayload>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  login(payload: { email: string; password: string }) {
    return request<AuthPayload>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  profile(token: string) {
    return request<UserDto>('/account/profile', {}, token)
  },

  listPosts() {
    return request<PostDto[]>('/posts?limit=20')
  },

  getPost(id: number) {
    return request<PostDto>(`/posts/${id}`)
  },

  createPost(payload: CreatePostPayload, token: string) {
    return request<PostDto>(
      '/posts',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token
    )
  },

  recordView(id: number) {
    return request<{ viewsCount: number }>(`/posts/${id}/views`, { method: 'POST' })
  },

  likePost(id: number, token: string) {
    return request<{ liked: boolean; likesCount: number }>(
      `/posts/${id}/likes`,
      { method: 'POST' },
      token
    )
  },

  unlikePost(id: number, token: string) {
    return request<{ liked: boolean; likesCount: number }>(
      `/posts/${id}/likes`,
      { method: 'DELETE' },
      token
    )
  },

  createComment(postId: number, body: string, token: string) {
    return request<CommentDto>(
      `/posts/${postId}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ body }),
      },
      token
    )
  },
}
