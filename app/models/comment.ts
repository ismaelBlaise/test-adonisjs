import { CommentSchema } from '#database/schema'
import Post from '#models/post'
import User from '#models/user'
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Comment extends CommentSchema {
  @belongsTo(() => Post)
  declare post: BelongsTo<typeof Post>

  @belongsTo(() => User, { foreignKey: 'userId' })
  declare author: BelongsTo<typeof User>
}
