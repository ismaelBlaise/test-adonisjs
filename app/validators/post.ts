import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

const title = () => vine.string().trim().minLength(3).maxLength(160)
const excerpt = () => vine.string().trim().maxLength(255).nullable()
const body = () => vine.string().trim().minLength(10)
const imageUrl = () => vine.string().trim().url().maxLength(2048)
const postImage = () =>
  vine.object({
    url: imageUrl(),
    altText: vine.string().trim().maxLength(255).nullable().optional(),
    sortOrder: vine.number().min(0).optional(),
  })

export const createPostValidator = vine.create({
  title: title(),
  excerpt: excerpt().optional(),
  coverImageUrl: imageUrl().nullable().optional(),
  images: vine.array(postImage()).maxLength(12).optional(),
  body: body(),
  isPublished: vine.boolean().optional(),
})

export const updatePostValidator = vine.create({
  title: title().optional(),
  excerpt: excerpt().optional(),
  coverImageUrl: imageUrl().nullable().optional(),
  images: vine.array(postImage()).maxLength(12).optional(),
  body: body().optional(),
  isPublished: vine.boolean().optional(),
})

export const listPostsValidator = vine.create({
  page: vine.number().withoutDecimals().min(1).optional(),
  limit: vine.number().withoutDecimals().min(1).max(50).optional(),
  q: vine.string().trim().maxLength(120).optional(),
})

export type CreatePostDto = Infer<typeof createPostValidator>
export type UpdatePostDto = Infer<typeof updatePostValidator>
export type ListPostsDto = Infer<typeof listPostsValidator>
