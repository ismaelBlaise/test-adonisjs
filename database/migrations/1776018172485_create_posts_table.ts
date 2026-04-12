import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'posts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('title', 160).notNullable()
      table.string('slug', 180).notNullable().unique()
      table.string('excerpt', 255).nullable()
      table.string('cover_image_url', 2048).nullable()
      table.text('body').notNullable()
      table.boolean('is_published').notNullable().defaultTo(false)
      table.integer('views_count').unsigned().notNullable().defaultTo(0)
      table.integer('likes_count').unsigned().notNullable().defaultTo(0)
      table.timestamp('published_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['user_id'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
