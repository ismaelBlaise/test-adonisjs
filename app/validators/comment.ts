import vine from '@vinejs/vine'

export const createCommentValidator = vine.create({
  body: vine.string().trim().minLength(2).maxLength(2000),
})

export const updateCommentValidator = vine.create({
  body: vine.string().trim().minLength(2).maxLength(2000),
})
