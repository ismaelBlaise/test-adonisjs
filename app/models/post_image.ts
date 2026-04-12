import { PostImageSchema } from '#database/schema'
import Post from '#models/post'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class PostImage extends PostImageSchema {
  @belongsTo(() => Post)
  declare post: BelongsTo<typeof Post>
}
