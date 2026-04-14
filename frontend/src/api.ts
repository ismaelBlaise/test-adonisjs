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
const API_ORIGIN = new URL(API_URL, window.location.origin).origin
const REQUEST_TIMEOUT = 12000

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

function toApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError({
      code: 'REQUEST_TIMEOUT',
      message: 'Le serveur met trop de temps a repondre. Reessaie dans un instant.',
      status: 408,
    })
  }

  if (error instanceof TypeError) {
    return new ApiError({
      code: 'NETWORK_ERROR',
      message: 'Connexion impossible avec le serveur.',
      status: 0,
    })
  }

  return error
}

async function parseResponse<T>(response: Response) {
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('application/json')) {
    const message = response.ok
      ? 'Reponse serveur inattendue.'
      : `Erreur serveur ${response.status}.`

    if (!response.ok) {
      throw new ApiError({
        code: 'HTTP_ERROR',
        message,
        status: response.status,
      })
    }

    return undefined as T
  }

  const payload = (await response.json()) as ApiEnvelope<T> | ApiErrorEnvelope

  if (!response.ok) {
    throw new ApiError((payload as ApiErrorEnvelope).error)
  }

  return (payload as ApiEnvelope<T>).data
}

async function request<T>(path: string, options: RequestInit = {}, token?: string) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  const headers = new Headers(options.headers)

  headers.set('Accept', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    })

    return await parseResponse<T>(response)
  } catch (error) {
    throw toApiError(error)
  } finally {
    window.clearTimeout(timeout)
  }
}

export function resolveAssetUrl(value: string | null | undefined) {
  if (!value) {
    return null
  }

  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value
  }

  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`
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

  logout(token: string) {
    return request<{ message: string }>('/auth/logout', { method: 'POST' }, token)
  },

  listPosts(query = '') {
    const search = new URLSearchParams({ limit: '30' })
    const cleanQuery = query.trim()

    if (cleanQuery) {
      search.set('q', cleanQuery)
    }

    return request<PostDto[]>(`/posts?${search.toString()}`)
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

  createPostWithFiles(payload: FormData, token: string) {
    return request<PostDto>(
      '/posts',
      {
        method: 'POST',
        body: payload,
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
