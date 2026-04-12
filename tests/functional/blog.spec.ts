import User from '#models/user'
import { test } from '@japa/runner'

test.group('Blog API', () => {
  test('creates and reads posts with comments', async ({ client, assert }) => {
    const author = await User.create({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
    })
    const commenter = await User.create({
      fullName: 'Grace Hopper',
      email: 'grace@example.com',
      password: 'password123',
    })

    const createPostResponse = await client
      .post('/api/v1/posts')
      .loginAs(author)
      .json({
        title: 'First Adonis Post',
        coverImageUrl: 'https://example.com/images/adonis-cover.jpg',
        images: [
          {
            url: 'https://example.com/images/adonis-1.jpg',
            altText: 'AdonisJS article illustration',
          },
          {
            url: 'https://example.com/images/adonis-2.jpg',
            altText: 'API workflow screenshot',
            sortOrder: 2,
          },
        ],
        body: 'This is a complete post body for the blog API.',
        isPublished: true,
      })

    createPostResponse.assertStatus(201)
    createPostResponse.assertBodyContains({
      title: 'First Adonis Post',
      slug: 'first-adonis-post',
      coverImageUrl: 'https://example.com/images/adonis-cover.jpg',
      isPublished: true,
      author: {
        email: 'ada@example.com',
      },
    })

    const post = createPostResponse.body()
    assert.equal(post.viewsCount, 0)
    assert.equal(post.likesCount, 0)
    assert.lengthOf(post.images, 2)

    const viewResponse = await client.post(`/api/v1/posts/${post.id}/views`)
    viewResponse.assertStatus(200)
    viewResponse.assertBodyContains({ viewsCount: 1 })

    const likeResponse = await client.post(`/api/v1/posts/${post.id}/likes`).loginAs(commenter)
    likeResponse.assertStatus(200)
    likeResponse.assertBodyContains({ liked: true, likesCount: 1 })

    const duplicateLikeResponse = await client
      .post(`/api/v1/posts/${post.id}/likes`)
      .loginAs(commenter)
    duplicateLikeResponse.assertStatus(200)
    duplicateLikeResponse.assertBodyContains({ liked: true, likesCount: 1 })

    const createCommentResponse = await client
      .post(`/api/v1/posts/${post.id}/comments`)
      .loginAs(commenter)
      .json({
        body: 'Nice article. The API flow works.',
      })

    createCommentResponse.assertStatus(201)
    createCommentResponse.assertBodyContains({
      postId: post.id,
      body: 'Nice article. The API flow works.',
      author: {
        email: 'grace@example.com',
      },
    })

    const showPostResponse = await client.get(`/api/v1/posts/${post.id}`)

    showPostResponse.assertStatus(200)
    assert.equal(showPostResponse.body().viewsCount, 1)
    assert.equal(showPostResponse.body().likesCount, 1)
    assert.lengthOf(showPostResponse.body().images, 2)
    assert.equal(showPostResponse.body().comments.length, 1)
    assert.equal(showPostResponse.body().comments[0].body, 'Nice article. The API flow works.')
  })
})
