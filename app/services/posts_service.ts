import Post from '#models/post'
import PostImage from '#models/post_image'
import PostLike from '#models/post_like'
import ForbiddenActionException from '#exceptions/forbidden_action_exception'
import ResourceNotFoundException from '#exceptions/resource_not_found_exception'
import { toPostDto, type PostDto } from '#dtos/post'
import type User from '#models/user'
import type { CreatePostDto, ListPostsDto, UpdatePostDto } from '#validators/post'
import { DateTime } from 'luxon'

type PostImageInput = {
  url: string
  altText?: string | null
  sortOrder?: number
}

type PaginatedPosts = {
  data: PostDto[]
  pagination: Record<string, unknown>
}

export default class PostsService {
  async list(filters: ListPostsDto): Promise<PaginatedPosts> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 10

    const postsQuery = Post.query()
      .preload('author')
      .preload('images', (imagesQuery) => {
        imagesQuery.orderBy('sort_order', 'asc')
      })
      .withCount('comments')
      .orderBy('created_at', 'desc')

    if (filters.q) {
      postsQuery.where((query) => {
        query.whereLike('title', `%${filters.q}%`).orWhereLike('body', `%${filters.q}%`)
      })
    }

    const paginatedPosts = await postsQuery.paginate(page, limit)
    return {
      data: paginatedPosts.all().map((post) => toPostDto(post)),
      pagination: paginatedPosts.getMeta(),
    }
  }

  async get(id: number | string): Promise<PostDto> {
    const post = await Post.query()
      .where('id', id)
      .preload('author')
      .preload('images', (imagesQuery) => {
        imagesQuery.orderBy('sort_order', 'asc')
      })
      .preload('comments', (commentsQuery) => {
        commentsQuery.preload('author').orderBy('created_at', 'asc')
      })
      .first()

    if (!post) {
      throw new ResourceNotFoundException('Post')
    }

    return toPostDto(post)
  }

  async create(author: User, payload: CreatePostDto): Promise<PostDto> {
    const isPublished = payload.isPublished ?? false
    const post = await Post.create({
      userId: author.id,
      title: payload.title,
      slug: await this.makeUniqueSlug(payload.title),
      excerpt: payload.excerpt ?? null,
      coverImageUrl: payload.coverImageUrl ?? null,
      body: payload.body,
      isPublished,
      viewsCount: 0,
      likesCount: 0,
      publishedAt: isPublished ? DateTime.utc() : null,
    })

    await this.syncImages(post, payload.images ?? undefined)
    await this.loadPostRelations(post)

    return toPostDto(post)
  }

  async update(author: User, id: number | string, payload: UpdatePostDto): Promise<PostDto> {
    const post = await this.findModel(id)
    this.ensureAuthorCanWrite(author, post)

    if (payload.title !== undefined) {
      post.title = payload.title
      post.slug = await this.makeUniqueSlug(payload.title, post.id)
    }

    if (payload.excerpt !== undefined) {
      post.excerpt = payload.excerpt
    }

    if (payload.coverImageUrl !== undefined) {
      post.coverImageUrl = payload.coverImageUrl
    }

    if (payload.body !== undefined) {
      post.body = payload.body
    }

    if (payload.isPublished !== undefined) {
      post.isPublished = payload.isPublished
      post.publishedAt = payload.isPublished ? (post.publishedAt ?? DateTime.utc()) : null
    }

    await this.syncImages(post, payload.images ?? undefined)
    await post.save()
    await this.loadPostRelations(post)

    return toPostDto(post)
  }

  async delete(author: User, id: number | string) {
    const post = await this.findModel(id)
    this.ensureAuthorCanWrite(author, post)

    await post.delete()
  }

  async recordView(id: number | string) {
    const post = await this.findModel(id)

    post.viewsCount += 1
    await post.save()

    return { viewsCount: post.viewsCount }
  }

  async like(user: User, id: number | string) {
    const post = await this.findModel(id)
    const existingLike = await PostLike.query()
      .where('post_id', post.id)
      .where('user_id', user.id)
      .first()

    if (!existingLike) {
      await PostLike.create({ postId: post.id, userId: user.id })
      post.likesCount += 1
      await post.save()
    }

    return {
      liked: true,
      likesCount: post.likesCount,
    }
  }

  async unlike(user: User, id: number | string) {
    const post = await this.findModel(id)
    const existingLike = await PostLike.query()
      .where('post_id', post.id)
      .where('user_id', user.id)
      .first()

    if (existingLike) {
      await existingLike.delete()
      post.likesCount = Math.max(0, post.likesCount - 1)
      await post.save()
    }

    return {
      liked: false,
      likesCount: post.likesCount,
    }
  }

  private async findModel(id: number | string) {
    const post = await Post.find(Number(id))

    if (!post) {
      throw new ResourceNotFoundException('Post')
    }

    return post
  }

  private ensureAuthorCanWrite(user: User, post: Post) {
    if (post.userId !== user.id) {
      throw new ForbiddenActionException('Only the author can change this post')
    }
  }

  private async loadPostRelations(post: Post) {
    await post.load('author')
    await post.load('images', (imagesQuery) => {
      imagesQuery.orderBy('sort_order', 'asc')
    })
  }

  private async syncImages(post: Post, images?: PostImageInput[]) {
    if (images === undefined) {
      return
    }

    await PostImage.query().where('post_id', post.id).delete()

    if (images.length === 0) {
      return
    }

    await PostImage.createMany(
      images.map((image, index) => ({
        postId: post.id,
        url: image.url,
        altText: image.altText ?? null,
        sortOrder: image.sortOrder ?? index,
      }))
    )
  }

  private slugify(title: string) {
    return (
      title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'post'
    )
  }

  private async makeUniqueSlug(title: string, ignorePostId?: number) {
    const baseSlug = this.slugify(title)
    let slug = baseSlug
    let suffix = 2

    while (await this.slugExists(slug, ignorePostId)) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    return slug
  }

  private async slugExists(slug: string, ignorePostId?: number) {
    const query = Post.query().where('slug', slug)

    if (ignorePostId) {
      query.whereNot('id', ignorePostId)
    }

    return Boolean(await query.first())
  }
}
