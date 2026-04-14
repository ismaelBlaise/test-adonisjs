/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'
import app from '@adonisjs/core/services/app'

router.get('/', () => {
  return { hello: 'world' }
})

router.get('/uploads/posts/:fileName', ({ params, response }) => {
  const fileName = String(params.fileName ?? '')

  if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
    return response.notFound({ error: { message: 'File not found' } })
  }

  return response.download(app.publicPath('uploads', 'posts', fileName), true, () => [
    'File not found',
    404,
  ])
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessToken, 'store'])
        router.post('logout', [controllers.AccessToken, 'destroy']).use(middleware.auth())
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('/profile', [controllers.Profile, 'show'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router.get('posts', [controllers.Posts, 'index']).as('posts.index')
    router.get('posts/:id', [controllers.Posts, 'show']).as('posts.show')
    router
      .get('posts/:post_id/comments', [controllers.Comments, 'index'])
      .as('posts.comments.index')
    router.post('posts/:id/views', [controllers.Posts, 'recordView']).as('posts.views.store')

    router
      .group(() => {
        router.post('posts', [controllers.Posts, 'store']).as('posts.store')
        router.patch('posts/:id', [controllers.Posts, 'update']).as('posts.update')
        router.delete('posts/:id', [controllers.Posts, 'destroy']).as('posts.destroy')
        router.post('posts/:id/likes', [controllers.Posts, 'like']).as('posts.likes.store')
        router.delete('posts/:id/likes', [controllers.Posts, 'unlike']).as('posts.likes.destroy')
        router
          .post('posts/:post_id/comments', [controllers.Comments, 'store'])
          .as('posts.comments.store')
        router.patch('comments/:id', [controllers.Comments, 'update']).as('comments.update')
        router.delete('comments/:id', [controllers.Comments, 'destroy']).as('comments.destroy')
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
