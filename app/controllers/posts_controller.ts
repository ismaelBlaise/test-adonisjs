import Post from '#models/post'
import PostImage from '#models/post_image'
import PostLike from '#models/post_like'
import { createPostValidator, updatePostValidator } from '#validators/post'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

type PostImageInput = {
  url: string
  altText?: string | null
  sortOrder?: number
}

export default class PostsController {
  async index({ request }: HttpContext) {
    const page = Number(request.input('page', 1))
    const limit = Math.min(Number(request.input('limit', 10)) || 10, 50)
    const search = request.input('q')

    const postsQuery = Post.query()
      .preload('author')
      .preload('images', (imagesQuery) => {
        imagesQuery.orderBy('sort_order', 'asc')
      })
      .withCount('comments')
      .orderBy('created_at', 'desc')

    if (search) {
      postsQuery.where((query) => {
        query.whereLike('title', `%${search}%`).orWhereLike('body', `%${search}%`)
      })
    }

    return postsQuery.paginate(page, limit)
  }

  async show({ params, response }: HttpContext) {
    const post = await Post.query()
      .where('id', params.id)
      .preload('author')
      .preload('images', (imagesQuery) => {
        imagesQuery.orderBy('sort_order', 'asc')
      })
      .preload('comments', (commentsQuery) => {
        commentsQuery.preload('author').orderBy('created_at', 'asc')
      })
      .first()

    if (!post) {
      return response.notFound({ message: 'Post not found' })
    }

    return post
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createPostValidator)
    const isPublished = payload.isPublished ?? false

    const post = await Post.create({
      userId: user.id,
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

    await this.syncImages(post, payload.images)
    await post.load('author')
    await post.load('images', (imagesQuery) => {
      imagesQuery.orderBy('sort_order', 'asc')
    })

    return response.created(post)
  }

  async update({ auth, params, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const post = await Post.find(params.id)

    if (!post) {
      return response.notFound({ message: 'Post not found' })
    }

    if (post.userId !== user.id) {
      return response.forbidden({ message: 'Only the author can update this post' })
    }

    const payload = await request.validateUsing(updatePostValidator)

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

    await this.syncImages(post, payload.images)
    await post.save()
    await post.load('author')
    await post.load('images', (imagesQuery) => {
      imagesQuery.orderBy('sort_order', 'asc')
    })

    return post
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const post = await Post.find(params.id)

    if (!post) {
      return response.notFound({ message: 'Post not found' })
    }

    if (post.userId !== user.id) {
      return response.forbidden({ message: 'Only the author can delete this post' })
    }

    await post.delete()

    return response.noContent()
  }

  async recordView({ params, response }: HttpContext) {
    const post = await Post.find(params.id)

    if (!post) {
      return response.notFound({ message: 'Post not found' })
    }

    post.viewsCount += 1
    await post.save()

    return {
      viewsCount: post.viewsCount,
    }
  }

  async like({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const post = await Post.find(params.id)

    if (!post) {
      return response.notFound({ message: 'Post not found' })
    }

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

  async unlike({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const post = await Post.find(params.id)

    if (!post) {
      return response.notFound({ message: 'Post not found' })
    }

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
