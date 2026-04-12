import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

export const createCommentValidator = vine.create({
  body: vine.string().trim().minLength(2).maxLength(2000),
})

export const updateCommentValidator = vine.create({
  body: vine.string().trim().minLength(2).maxLength(2000),
})

export type CreateCommentDto = Infer<typeof createCommentValidator>
export type UpdateCommentDto = Infer<typeof updateCommentValidator>
