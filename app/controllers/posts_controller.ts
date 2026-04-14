import PostsService from '#services/posts_service'
import ApiException from '#exceptions/api_exception'
import { ok, paginated } from '#http/responses'
import { createPostValidator, listPostsValidator, updatePostValidator } from '#validators/post'
import app from '@adonisjs/core/services/app'
import type { HttpContext } from '@adonisjs/core/http'
import type { MultipartFile } from '@adonisjs/bodyparser'
import { mkdir } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

const imageValidation = {
  size: '5mb',
  extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
}
const maxGalleryImages = 12

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

  async store(ctx: HttpContext) {
    const { auth, request, response } = ctx

    if (request.bodyType === 'multipart') {
      return this.storeFromMultipart(ctx)
    }

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

  private async storeFromMultipart({ auth, request, response }: HttpContext) {
    const coverImage = request.file('coverImage', imageValidation)
    const galleryImages = request.files('images', imageValidation)
    const files = [coverImage, ...galleryImages].filter((file): file is MultipartFile => Boolean(file))
    this.ensureImagesAreValid(files)
    this.ensureGallerySize(galleryImages)

    const payload = await request.validateUsing(createPostValidator, {
      data: {
        title: request.input('title'),
        excerpt: request.input('excerpt') ?? null,
        body: request.input('body'),
        isPublished: this.toBoolean(request.input('isPublished')),
        coverImageUrl: null,
        images: [],
      },
    })

    const coverImageUrl = coverImage ? await this.moveImage(coverImage) : null
    const images = await Promise.all(
      galleryImages.map(async (image, index) => ({
        url: await this.moveImage(image),
        altText: image.clientName,
        sortOrder: index,
      }))
    )

    const post = await this.postsService.create(auth.getUserOrFail(), {
      ...payload,
      coverImageUrl,
      images,
    })

    return response.created(ok(post))
  }

  private toBoolean(value: unknown) {
    return value === true || value === 'true' || value === 'on' || value === '1'
  }

  private ensureImagesAreValid(files: MultipartFile[]) {
    const errors = files.flatMap((file) => file.errors)

    if (errors.length > 0) {
      throw new ApiException('Les images envoyees sont invalides.', {
        code: 'INVALID_IMAGES',
        status: 422,
        details: errors,
      })
    }
  }

  private ensureGallerySize(files: MultipartFile[]) {
    if (files.length <= maxGalleryImages) {
      return
    }

    throw new ApiException(`La galerie accepte ${maxGalleryImages} photos maximum.`, {
      code: 'TOO_MANY_GALLERY_IMAGES',
      status: 422,
      details: { max: maxGalleryImages },
    })
  }

  private async moveImage(file: MultipartFile) {
    const uploadPath = app.publicPath('uploads', 'posts')
    await mkdir(uploadPath, { recursive: true })

    const extension = file.extname ? `.${file.extname}` : ''
    const fileName = `${Date.now()}-${randomUUID()}${extension}`

    await file.move(uploadPath, {
      name: fileName,
      overwrite: false,
    })

    return `/uploads/posts/${fileName}`
  }
}
